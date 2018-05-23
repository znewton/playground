let user;
const githubUrl = "https://api.github.com/";
const GET = "get";
const POST = "post";

async function getPullRequestsGraphQL() {
  if (!user) {
    user = await ajax(GET, `${githubUrl}user`);
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
  let response = await ajax(POST, `${githubUrl}graphql`, query);
  let prs = [];
  if (response && response.data && response.data.search) {
    prs = response.data.search.edges.map(edge => edge.node);
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
    edge => edge.node.commit.status.contexts
  );
  const reviews = pr.reviews.edges.map(edge => edge.node);
  let mergeable = false;
  let approvals = 0;
  for (const review of reviews) {
    if (review.state === "APPROVED") {
      approvals++;
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

class PullRequest extends HTMLElement {
  constructor(pr) {}
}

function buildPRDOM(pull_requests = []) {}

getPullRequestsGraphQL().then(pull_requests => {
  pull_requests = pull_requests.map(pr => checkMergeability(pr));
  buildPRDOM(pull_requests);
});
