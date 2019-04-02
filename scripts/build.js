// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = "production";
process.env.NODE_ENV = "production";

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on("unhandledRejection", err => {
  throw err;
});

// Ensure environment variables are read.
require("../config/env");

const chalk = require("chalk");
const fs = require("fs-extra");
const path = require("path");
const webpack = require("webpack");
const bfj = require("bfj");
const config = require("../config/webpack.config.prod");
const paths = require("../config/paths");
const checkRequiredFiles = require("react-dev-utils/checkRequiredFiles");
const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");
const NwBuilder = require("nw-builder");
const FileSizeReporter = require("react-dev-utils/FileSizeReporter");
const printBuildError = require("react-dev-utils/printBuildError");
const appPackageJson = require("../package.json");

const measureFileSizesBeforeBuild =
  FileSizeReporter.measureFileSizesBeforeBuild;
const printFileSizesAfterBuild = FileSizeReporter.printFileSizesAfterBuild;

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

const isInteractive = process.stdout.isTTY;

// Set externals to avoid native modules and other
// node module import weirdness
config.externals = {};

config.externals['sfdx-node'] = 'commonjs sfdx-node';

const subDependencies = {};
const calledWith = [];
const nmCalledWith = [];
const nmPathExists = [];
const copiedFiles = {};

// Todo: seems the build is minifying the code listed as externals on the config; should see if can take advantage of this and where it puts the minified code to include it in the built package

// take in a dependency name
// get that file from node modules
// if has no package.json, treat the subfolders as the top levels
// 1. find package.json file
//   get all dependencies, if they have top-level modules, add them to 
//   externals
// 2. if there's a node_modules folder, send each folder back to this function

// ex: "sfdx-node"

// "node_modules" / "sfdx-node"
// no pkg: "node_modules/sfdx-node" / "core"

// path = "node_modules/sfdx-node" / "core"
// pkg: has "ip-regex" and it's a top-level module, call parent func with "node_modules"/"ip-regex"
// has node_modules: path + "node_modules"; call parent func with "path" / "node_modules" + each module name

function handleDependencies(modulePath) {
  nmCalledWith.push(modulePath);

  if (isTopLevelModule(modulePath)) {
    const moduleName = path.parse(modulePath).name;
    addWebpackExternal(moduleName);
  }

  if (fs.pathExistsSync(modulePath)) {
    handleModulePkgJson(modulePath)
  }
  // If folder doesn't have package.json, try to see if it's a directory of folders
  else if (!fs.emptyDirSync(modulePath)) {
    fs.readdirSync(modulePath)
      .filter(subModule => !subModule.includes('.bin'))
      .forEach(subModule => {
        handleDependencies(path.join(modulePath, subModule));
      });
  }
}

function isTopLevelModule(modulePath) {
  const moduleName = path.parse(modulePath) && path.parse(modulePath).name;
  return moduleName && fs.pathExistsSync(path.join('node_modules', moduleName));
}

function handleModulePkgJson(modulePath) {
  const modulePkg = fs.readJSONSync(
    path.join(modulePath, "package.json"),
    {
      throws: false
    }
  );
  const dep = {};

  dep.modulePkg = modulePkg;


  if (modulePkg) {

    const dependencies = modulePkg.dependencies || {};

    subDependencies[modulePkg.name || modulePath] = dependencies;

    Object.keys(dependencies).forEach(dependency => {
      const topModulePath = path.join('node_modules', dependency)
      if (fs.pathExistsSync(topModulePath)) {
        addWebpackExternal(dependency);
        handleDependencies(topModulePath);
      }
    })
  }

  // Handle all node modules of node modules
  if (fs.pathExistsSync(path.join(modulePath, 'node_modules'))) {
    fs.readdirSync(path.join(modulePath, 'node_modules'))
      .filter(module => !module.includes('.bin'))
      .forEach(module => {
        handleDependencies(path.join(modulePath, 'node_modules', module));
      });
  }
}

function addWebpackExternal(module) {
  config.externals[module] = `commonjs ${module}`;
}

function copyExternalsToPublic(ext, publicModulesPath) {
  fs.pathExists(publicModulesPath) && fs.removeSync(publicModulesPath);

  // Copy all externals to the public folder
  fs.ensureDirSync(publicModulesPath);
  Object.keys(ext).forEach(module => {
    const modulePath = path.join("node_modules", module);
    if (fs.pathExistsSync(modulePath)) {
      copiedFiles[module] = modulePath;
      fs.copySync(modulePath, path.join(publicModulesPath, module), {
        dereference: true
      });
    }
  });
}

const externals = appPackageJson.externals || [];

externals.forEach(module => handleDependencies(path.join('node_modules', module)));

const distModulesPath = path.join("public", "node_modules");

copyExternalsToPublic(config.externals, distModulesPath);

fs.writeFile(
  `debug.${Date.now()}.json`,
  JSON.stringify(
    {
      externals: config.externals,
      subDependencies,
      calledWith,
      nmCalledWith,
      nmPathExists
    },
    false,
    2
  )
);

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

// Process CLI arguments
const argv = process.argv.slice(2);
const writeStatsJson = argv.indexOf("--stats") !== -1;

// We require that you explicitly set browsers and do not fall back to
// browserslist defaults.
const { checkBrowsers } = require("react-dev-utils/browsersHelper");
checkBrowsers(paths.appPath, isInteractive)
  .then(() => {
    // First, read the current file sizes in build directory.
    // This lets us display how much they changed later.
    return measureFileSizesBeforeBuild(paths.appBuild);
  })
  .then(previousFileSizes => {
    // Remove all content but keep the directory so that
    // if you're in it, you don't end up in Trash
    fs.emptyDirSync(paths.appBuild);
    // Copy the package.json
    fs.copySync(paths.appPackageJson, `${paths.appBuild}/package.json`);
    // Merge with the public folder
    copyPublicFolder();
    // Start the webpack build
    return build(previousFileSizes);
  })
  .then(
    ({ stats, previousFileSizes, warnings }) => {
      if (warnings.length) {
        console.log(chalk.yellow("Compiled with warnings.\n"));
        console.log(warnings.join("\n\n"));
        console.log(
          "\nSearch for the " +
          chalk.underline(chalk.yellow("keywords")) +
          " to learn more about each warning."
        );
        console.log(
          "To ignore, add " +
          chalk.cyan("// eslint-disable-next-line") +
          " to the line before.\n"
        );
      } else {
        console.log(chalk.green("Compiled successfully.\n"));
      }

      console.log("File sizes after gzip:\n");
      printFileSizesAfterBuild(
        stats,
        previousFileSizes,
        paths.appBuild,
        WARN_AFTER_BUNDLE_GZIP_SIZE,
        WARN_AFTER_CHUNK_GZIP_SIZE
      );
      console.log();

      // Build the app
      const options = require(paths.appPackageJson).nwBuilder;
      options.files = `${paths.appBuild}/**/*`;

      const nw = new NwBuilder(options);
      nw.build()
        .then(() => {
          process.exit(0);
        })
        .catch(err => {
          console.error(err);
          process.exit(1);
        });
    },
    err => {
      console.log(chalk.red("Failed to compile.\n"));
      printBuildError(err);
      process.exit(1);
    }
  )
  .catch(err => {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });

// Create the production build and print the deployment instructions.
function build(previousFileSizes) {
  console.log("Creating an optimized production build...");

  let compiler = webpack(config);
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      let messages;
      if (err) {
        if (!err.message) {
          return reject(err);
        }
        messages = formatWebpackMessages({
          errors: [err.message],
          warnings: []
        });
      } else {
        messages = formatWebpackMessages(
          stats.toJson({ all: false, warnings: true, errors: true })
        );
      }
      if (messages.errors.length) {
        // Only keep the first error. Others are often indicative
        // of the same problem, but confuse the reader with noise.
        if (messages.errors.length > 1) {
          messages.errors.length = 1;
        }
        return reject(new Error(messages.errors.join("\n\n")));
      }
      if (
        process.env.CI &&
        (typeof process.env.CI !== "string" ||
          process.env.CI.toLowerCase() !== "false") &&
        messages.warnings.length
      ) {
        console.log(
          chalk.yellow(
            "\nTreating warnings as errors because process.env.CI = true.\n" +
            "Most CI servers set it automatically.\n"
          )
        );
        return reject(new Error(messages.warnings.join("\n\n")));
      }

      const resolveArgs = {
        stats,
        previousFileSizes,
        warnings: messages.warnings
      };
      if (writeStatsJson) {
        return bfj
          .write(paths.appBuild + "/bundle-stats.json", stats.toJson())
          .then(() => resolve(resolveArgs))
          .catch(error => reject(new Error(error)));
      }

      return resolve(resolveArgs);
    });
  });
}

function copyPublicFolder() {
  fs.copySync(paths.appPublic, paths.appBuild, {
    dereference: true,
    filter: file => file !== paths.appHtml
  });
}
