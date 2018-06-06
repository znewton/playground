let chosenOne = null;

const squirrels = [
  "http://shipitsquirrel.github.io/images/ship%20it%20squirrel.png",
  "http://images.cheezburger.com/completestore/2011/11/2/aa83c0c4-2123-4bd3-8097-966c9461b30c.jpg",
  "http://images.cheezburger.com/completestore/2011/11/2/46e81db3-bead-4e2e-a157-8edd0339192f.jpg",
  "http://28.media.tumblr.com/tumblr_lybw63nzPp1r5bvcto1_500.jpg",
  "http://i.imgur.com/DPVM1.png",
  "http://d2f8dzk2mhcqts.cloudfront.net/0772_PEW_Roundup/09_Squirrel.jpg",
  "http://www.cybersalt.org/images/funnypictures/s/supersquirrel.jpg",
  "http://www.zmescience.com/wp-content/uploads/2010/09/squirrel.jpg",
  "http://img70.imageshack.us/img70/4853/cutesquirrels27rn9.jpg",
  "http://img70.imageshack.us/img70/9615/cutesquirrels15ac7.jpg",
  "https://dl.dropboxusercontent.com/u/602885/github/sniper-squirrel.jpg",
  "http://1.bp.blogspot.com/_v0neUj-VDa4/TFBEbqFQcII/AAAAAAAAFBU/E8kPNmF1h1E/s640/squirrelbacca-thumb.jpg",
  "https://dl.dropboxusercontent.com/u/602885/github/soldier-squirrel.jpg",
  "https://dl.dropboxusercontent.com/u/602885/github/squirrelmobster.jpeg"
];
// from https://hackernoon.com/copying-text-to-clipboard-with-javascript-df4d4988697f
const copyToClipboard = str => {
  const el = document.createElement("textarea"); // Create a <textarea> element
  el.value = str; // Set its value to the string that you want copied
  el.setAttribute("readonly", ""); // Make it readonly to be tamper-proof
  el.style.position = "absolute";
  el.style.left = "-9999px"; // Move outside the screen to make it invisible
  document.body.appendChild(el); // Append the <textarea> element to the HTML document
  const selected =
    document.getSelection().rangeCount > 0 // Check if there is any content selected previously
      ? document.getSelection().getRangeAt(0) // Store selection if found
      : false; // Mark as false to know no selection existed before
  el.select(); // Select the <textarea> content
  document.execCommand("copy"); // Copy - only works as a result of a user action (e.g. click events)
  document.body.removeChild(el); // Remove the <textarea> element
  if (selected) {
    // If a selection existed before copying
    document.getSelection().removeAllRanges(); // Unselect everything on the HTML document
    document.getSelection().addRange(selected); // Restore the original selection
  }
};

function copyShipit() {
  let shipit = `
<h2>Ship it</h2>
<img src="${chosenOne}" title="Ship It" style="max-height: 300px, max-width: 300px" />
`;
  copyToClipboard(shipit);
  console.log(shipit);
}

function getRandomImg(tried = []) {
  return new Promise(resolve => {
    if (tried.length >= squirrels.length) {
      resolve(null);
    }
    let rand = Math.floor(Math.random() * squirrels.length);
    while (tried.indexOf(rand) >= 0) {
      rand = Math.floor(Math.random() * squirrels.length);
    }
    const src = squirrels[rand];
    let oImg = new Image();
    oImg.src = src;
    oImg.onload = () => {
      resolve(src);
    };
    oImg.onerror = async () => {
      tried.push(src);
      const newSrc = await getRandomImg(tried);
      resolve(newSrc);
    };
  });
}

async function loadShipitView() {
  const sqrl = document.getElementById("sqrl");
  chosenOne = await getRandomImg();
  sqrl.src = chosenOne;
  sqrl.onclick = () => copyShipit();
  document.getElementById("shipit-refresh").onclick = () => loadShipitView();
}

document.addEventListener("viewSwitch", e => {
  if (e.detail.view === "shipit") loadShipitView();
});
