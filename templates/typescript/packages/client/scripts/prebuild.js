const path = require("path");
const fs = require("fs-extra");

const root = path.resolve(__dirname, "..");
const appBuild = path.join(path.resolve(root, ".."), "app", "build");
const dist = path.join(root, "dist");
const renderer = path.join(dist, "renderer");

if (fs.existsSync(dist)) {
  fs.emptyDir(dist)
    .then(() => fs.mkdir(renderer))
    .then(() => fs.copy(appBuild, renderer))
    .catch(err => {
      console.log(err);
      process.exit(0);
    });
} else {
  fs.mkdir(dist)
    .then(() => fs.mkdir(renderer))
    .then(() => fs.copy(appBuild, renderer))
    .catch(err => {
      console.log(err);
      process.exit(0);
    });
}
