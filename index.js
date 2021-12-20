#! /usr/bin/env node
import prompts from "prompts"; // interactive prompts
import parseArgs from "minimist"; // get and parse command line parameters
import fs from "fs-extra"; // substitute for fs
import ora from "ora"; // elegant terminal spinner
import execa from "execa"; // process execution
import boxen from "boxen"; // create boxes in the terminal

const argv = parseArgs(process.argv.slice(2)); // top 2 argv
{
  (async () => {
    if (argv._.length != 0) {
      let msg = "";
      const command = argv._[0];
      const libName = argv._[1];
      const rootPath = libName;
      // Get and determine the command to be executed
      if (command == "create" && rootPath) {
        const template = argv.template;

        // Definition of all command line interaction issues
        const questions = [
          {
            type: "select",
            name: "type",
            message: "Which type do you want to build ",
            choices: [
              {
                title: "lib",
                value: "lib",
              },
              {
                title: "SPA",
                value: "spa",
              },
            ],
          },
          {
            type: "text",
            name: "description",
            message: "description",
          },
          {
            ...(template || {
              type: "select",
              name: "platform",
              message: "Which platform do you want to build for",
              choices: [
                {
                  title: "React",
                  value: "React",
                },
                {
                  title: "Vue",
                  value: "Vue",
                },
                {
                  title: "Svelte",
                  value: "Svelte",
                },
              ],
            }),
          },
          {
            type: "select",
            name: "language",
            message: "Which language do you want to use",
            choices: [
              {
                title: "js",
                value: "js",
              },
              {
                title: "ts",
                value: "ts",
              },
            ],
          },
          {
            type: "confirm",
            name: "needServer",
            message: "Can you need local server?",
          },
          {
            type: "confirm",
            name: "needPrettier",
            message: "Can you need prettier?",
          },
        ];

        // Get all the command line parameters and prompt the task to start
        const config = await prompts(questions);
        msg = "create lib...";
        const spinner = ora(msg).start();

        try {
          // Check if the file directory already exists
          const exists = await fs.pathExists(rootPath);

          if (exists) {
            spinner.stop();
            const deConfirm = await prompts([
              {
                type: "confirm",
                name: "delete",
                message:
                  libName +
                  " already exists in the current path. Do you need to delete it?",
              },
            ]);
            if (!deConfirm.delete) {
              spinner.succeed("ok, you can try another name");
              throw new Error();
            }
            spinner.start(msg);
          }

          await fs.remove("./" + libName);
          await fs.ensureDir(rootPath);

          // Initialize the node project
          await execa("npm init -y", "", { cwd: rootPath });

          // Confirm and create or rewrite the required files
          switch (config.type) {
            case "lib":
              await fs.ensureDir(rootPath + "/src");
              await fs.ensureFile(rootPath + "/src/index." + config.language);
              await fs.writeJson(`./${rootPath}/package.json`, {
                description: config.description,
                main: "dist/index." + config.language,
                module: "dist/index." + config.language,
                files: ["dist"],
                ...(config.language == "ts" && { typings: "dist/index.d.ts" }),
                keywords: [config.platform, config.type],
                scripts: {
                  dev: "rollup -wc rollup.config.js",
                  "build:dev":
                    "cross-env NODE_ENV=development rollup -c rollup.config.js",
                  "build:prod":
                    "cross-env NODE_ENV=production rollup -c rollup.config.js",
                },
                devDependencies: {
                  "@rollup/plugin-commonjs": "^14.0.0",
                  "@rollup/plugin-node-resolve": "^8.4.0",
                  "cross-env": "^7.0.3",
                  ...(config.needPrettier && {
                    prettier: "^2.5.1",
                  }),
                  rollup: "^2.61.1",
                  "rollup-plugin-filesize": "^9.1.1",
                  "rollup-plugin-peer-deps-external": "^2.2.4",
                  "rollup-plugin-terser": "^6.1.0",
                  "rollup-plugin-typescript2": "^0.31.1",
                  ...(config.language == "ts" && {
                    tslib: "^2.3.1",
                    typescript: "^4.5.4",
                  }),
                },
              });
              await fs.copyFile(
                `./rollup.config.js`,
                `./${rootPath}/rollup.config.js`
              );
              if (config.needServer) {
                await fs.ensureDir(rootPath + "/example");
                await fs.copyFile(
                  `./index.html`,
                  `./${rootPath}/example/index.html`
                );
                await fs.ensureFile(rootPath + "/example/index.js");
                await fs.writeJson(`./${rootPath}/package.json`, {
                  name: "example",
                  version: "1.0.0",
                  main: "index.js",
                  license: "MIT",
                  scripts: {
                    start: "parcel index.html",
                    build: "parcel build index.html",
                  },
                  devDependencies: {
                    parcel: "^2.0.1",
                  },
                });
              }
              break;
            case "spa":
              break;
            default:
              break;
          }

          // Output running results or prompts
          msg = "Your project has been successfully created!";
          spinner.succeed(msg);
          console.log(
            boxen(`run 'cd ${libName} && npm install' to start your coding `, {
              title: "ROUE Cli",
              borderColor: "#22577A",
              borderStyle: "bold",
              float: "center",
              align: "center",
              padding: { top: 1, left: 4, right: 4, bottom: 1 },
            })
          );
        } catch (err) {}
      }
    }
  })();
}
