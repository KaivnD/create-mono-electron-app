"use strict";

const handlebars = require("handlebars");
const execa = require("execa");
const fs = require("fs-extra");
const globby = require("globby");
const ora = require("ora");
const path = require("path");
const pEachSeries = require("p-each-series");

const pkg = require("../package");

const templateBlacklist = new Set(["example/public/favicon.ico"]);

module.exports = async info => {
  const { manager, template, name, templatePath, git } = info;

  // handle scoped package names
  const parts = name.split("/");
  info.shortName = parts[parts.length - 1];

  const dest = path.join(process.cwd(), info.shortName);
  info.dest = dest;

  if (fs.existsSync(dest)) {
    console.log(
      `${dest} is not empty! Please remove it or change package name.`
    );
    process.exit(0);
  }

  await fs.mkdir(dest);

  const source =
    template === "custom"
      ? path.join(process.cwd(), templatePath)
      : path.join(__dirname, "..", "templates", template);
  const files = await globby(source, {
    dot: true
  });

  const copy = pEachSeries(files, async file => {
    return copyTemplateFile({
      file,
      source,
      dest,
      info
    });
  });

  ora.promise(copy, `Copying ${template} template to ${dest}`);

  await copy;

  const install = execa(manager, ["install"], {
    cwd: dest,
    stdio: "inherit"
  });

  // install.stdout.pipe(process.stdout);

  console.log(`Running ${manager} install`);

  await install;

  if (git) {
    const git = initGitRepo({ dest });
    ora.promise(git, "Initializing git repo");
    await git;
  }

  return dest;
};

async function copyTemplateFile(opts) {
  const { file, source, dest, info } = opts;

  const fileRelativePath = path.relative(source, file);
  const destFilePath = path.join(dest, fileRelativePath);
  const destFileDir = path.parse(destFilePath).dir;

  if (!fs.existsSync(destFileDir)) {
    await fs.mkdirp(destFileDir);
  }

  if (templateBlacklist.has(fileRelativePath)) {
    const content = fs.readFileSync(file);
    fs.writeFileSync(destFilePath, content);
  } else {
    const template = handlebars.compile(fs.readFileSync(file, "utf8"));
    const content = template({
      ...info,
      yarn: info.manager === "yarn"
    });

    fs.writeFileSync(destFilePath, content, "utf8");
  }

  return fileRelativePath;
}

async function initGitRepo(opts) {
  const { dest } = opts;

  const gitIgnorePath = path.join(dest, ".gitignore");
  fs.writeFileSync(
    gitIgnorePath,
    `
# See https://help.github.com/ignore-files/ for more about ignoring files.

# dependencies
node_modules

# builds
build
dist
.rpt2_cache

# misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*
`,
    "utf8"
  );

  const commands = [
    {
      cmd: ["init", "."],
      cwd: dest
    },
    {
      cmd: ["add", "."],
      cwd: dest
    },
    {
      cmd: ["commit", "-m", `"init ${pkg.name}@${pkg.version}"`],
      cwd: dest
    }
  ];

  return pEachSeries(commands, async ({ cmd, cwd }) => {
    return execa("git", cmd, { cwd: cwd });
  });
}
