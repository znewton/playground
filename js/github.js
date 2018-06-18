let user;
const githubUrl = "https://api.github.com";
const GET = "get";
const POST = "post";

async function getPullRequestsGraphQL() {
  if (!user) {
    user = await ajax(GET, `${githubUrl}/user`);
  }
  const query = JSON.stringify({
    query: `
    {
      search(type: ISSUE, query: "is:open is:pr author:${
        user.login
      }", last: 20) {
        edges {
          node {
            ... on PullRequest {
              title,
              url,
              id,
              number,
              repository {
                name
                owner {
                  login
                }
              }
              headRefName
              labels(last: 10) {
                edges {
                  node{
                    name
                    color
                  }
                }
              },
              commits(last: 1) {
                edges {
                  node {
                    commit {
                      status {
                        contexts {
                          description
                          state
                          context
                          targetUrl
                        }
                      }
                    }
                  }
                }
              },
              comments(last: 50) {
                edges {
                  node {
                    body
                    createdAt
                    author {
                      avatarUrl
                      login
                      resourcePath
                      url
                    }
                  }
                }
              },
              reviews(last: 50) {
                edges {
                  node {
                    body
                    state
                    author {
                      login
                    }
                  }
                }
              }
              author {
                avatarUrl
                login
                resourcePath
                url
              },
            }
          }
        }
      }
    }
      `
  });
  let response = await ajax(POST, `${githubUrl}/graphql`, query);
  let prs = [];
  if (response && response.data && response.data.search) {
    prs = response.data.search.edges.map(edge => edge.node);
  } else {
    console.error(response.errors);
  }
  return prs;
}

async function ajax(type, url, data) {
  return new Promise(resolve => {
    let request = new XMLHttpRequest();
    request.addEventListener("load", function() {
      let responseObj = JSON.parse(this.responseText);
      resolve(responseObj);
    });
    // Initialize a request
    request.open(`${type}`, `${url}`, true);
    request.setRequestHeader("Authorization", `token ${github_access_token}`);
    // Send it
    request.send(data);
  });
}

function checkMergeability(pr) {
  const commits = pr.commits.edges.map(
    edge => edge.node.commit.status ?
      edge.node.commit.status.contexts
      : []
  );
  const reviews = pr.reviews.edges.map(edge => edge.node);
  let mergeable = false;
  let approvals = 0;
  pr.passing = true;
  for (let i = 0; i < reviews.length; i++) {
    let authorName = reviews[i].author.login;
    for (let j = i + 1; j < reviews.length; j++) {
      if (reviews[j].author.login === authorName) {
        reviews.splice(i, 1);
        i--;
        break;
      }
    }
  }
  for (const review of reviews) {
    if (review.state === "APPROVED") {
      approvals++;
      pr.approved = true;
    } else if (review.state !== "PENDING" && review.state !== "COMMENTED") {
      mergeable = false;
      pr.approved = false;
      break;
    }
  }
  mergeable = approvals >= 1;
  for (const context of commits[0]) {
    if (context.state !== "SUCCESS") {
      mergeable = false;
      pr.passing = false;
      break;
    }
  }
  pr.mergeable = mergeable;
  return pr;
}

class LoadingSpinnerElement {
  render() {
    const element = document.createElement("div");
    element.className = "loader";
    element.appendChild(document.createElement("span"));
    return element;
  }
}

class PullRequestElement {
  constructor(pr) {
    this.pr = pr;
    console.log(pr);
  }
  render() {
    const element = document.createElement("a");
    element.id = this.pr.id;
    element.href = this.pr.url;
    element.target = "_blank";
    element.className = "pull-request";
    const titleBlock = document.createElement("div");
    titleBlock.className = "title-block";
    titleBlock.innerText = this.pr.title;
    const labelBlock = document.createElement("div");
    labelBlock.className = "label-block";
    let mergeableTag = this.getMergableTag();
    labelBlock.appendChild(this.getApprovedTag());
    labelBlock.appendChild(this.getPassingTag());
    if (mergeableTag) labelBlock.appendChild(mergeableTag);
    element.appendChild(titleBlock);
    element.appendChild(labelBlock);
    return element;
  }
  getMergableTag() {
    if (!this.pr.mergeable) return null;
    const element = document.createElement("span");
    element.classList.add("tag", "success");
    element.innerText = "Mergeable";
    return element;
  }
  getPassingTag() {
    const element = document.createElement("span");
    element.classList.add("tag", this.pr.passing ? "success" : "error");
    element.innerText = "Passing";
    return element;
  }
  getApprovedTag() {
    const element = document.createElement("span");
    element.classList.add("tag", this.pr.approved ? "success" : "error");
    element.innerText = "Approved";
    return element;
  }
}

const prList = document
  .getElementById("github")
  .getElementsByClassName("pr-list")[0];

function buildPRDOM(pull_requests = []) {
  prList.innerHTML = null;

  for (const pr of pull_requests) {
    prList.appendChild(new PullRequestElement(pr).render());
  }
}
let mergeAll = () => {};
prList.innerHTML = null;
prList.appendChild(new LoadingSpinnerElement().render());

function loadGitHubView() {
  getPullRequestsGraphQL().then(pull_requests => {
    pull_requests = pull_requests.map(pr => checkMergeability(pr));
    pull_requests.sort((a, b) => {
      if (a.mergeable && !b.mergeable) {
        return -1;
      }
      if (b.mergeable && !a.mergeable) {
        return 1;
      }
      return 0;
    });
    buildPRDOM(pull_requests);
    mergeAll = async () => {
      for (const pull_request of pull_requests) {
        if (!pull_request.mergeable || pull_request.merged === true) continue;
        const prElement = document.getElementById(pull_request.id);
        prElement.classList.add("merging");
        const response = await ajax(
          "put",
          `${githubUrl}/repos/${pull_request.repository.owner.login}/${
            pull_request.repository.name
          }/pulls/${pull_request.number}/merge`,
          JSON.stringify({
            commit_message: `Merge pull request #${pull_request.number} from ${
              pull_request.repository.owner.login
            }/${pull_request.headRefName}
          ${pull_request.title}`
          })
        );
        console.log(response);
        prElement.classList.remove("merging");
        if (response.merged === true) {
          prElement.classList.add("merge-success");
          setTimeout(() => {
            prElement.remove();
            pull_request.merged = true;
          }, 3000);
        } else {
          prElement.classList.add("merge-fail");
        }
        await new Promise(resolve => {
          setTimeout(() => {
            resolve();
          }, 5000);
        });
      }
    };
    document.removeEventListener("click", mergeAll);
    document.getElementById("merge-all").addEventListener("click", mergeAll);
  });
}

document.addEventListener("viewSwitch", e => {
  if (e.detail.view === "github") loadGitHubView();
});
