function handleResponse() {}

async function request(url) {
  let response;
  // Create a new request object
  let request = new XMLHttpRequest();
  request.addEventListener("load", function() {
    let responseObj = JSON.parse(this.responseText);
    response = responseObj;
  });
  // Initialize a request
  request.open("get", `https://api.github.com/${url}`, false);
  // Send it
  request.send();

  return response;
}

async function getPullRequests() {
  let repos = await request("users/znewton/repos");
  let pulls = [];
  let pullFutures = [];
  for (const key in Object.keys(repos)) {
    const repo = repos[key];
    pullFutures.push(async () => {
      console.log(
        request(repo.pulls_url.replace("https://api.github.com/", ""))
      );
    });
  }
  await Promise.all(pullFutures);
  console.log(pullFutures);
}

getPullRequests();
