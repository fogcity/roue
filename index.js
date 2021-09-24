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
      const command = argv._[0];
      const libName = argv._[1];
      const rootPath = libName;
      if (command == "create" && libName) {
        const template = argv.template;

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
                title: "spa",
                value: "spa",
              },
              {
                title: "cli",
                value: "cli",
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
            name: "needEslint",
            message: "Can you need eslint?",
          },
          {
            type: "confirm",
            name: "needTest",
            message: "Can you need test?",
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

        const config = await prompts(questions);
        const spinner = ora("create files...").start();
        try {
          switch (config.type) {
            case "lib":
              await fs.ensureDir(rootPath);
              await fs.ensureDir(rootPath + "/src");

              if (config.needServer) {
                await fs.ensureDir(rootPath + "/example");
              }
              const { stdout } = await execa("cd sytudu");
              console.log(stdout);
              // execa("npm init -y").stdout.pipe(process.stdout);
              // execa(`cd ..`).stdout.pipe(process.stdout);

              await fs.outputJson(rootPath + "/package.json", {
                name: libName,
                version: "0.0.1",
                description: config.description,
                main: "dist/index.js",
                module: "dist/index.js",
                files: ["dist"],
                typings: "dist/index.d.ts",
                scripts: {
                  dev: "rollup -wc rollup.config.dev.js",
                  "build:dev": "rollup -c rollup.config.dev.js",
                  "build:prod":
                    "npm run lint && npm run test && rollup -c rollup.config.prod.js",
                  test: "jest",
                  "test:watch": "jest --watch",
                  size: "size-limit",
                  analyze: "size-limit --why",
                  lint: "eslint --fix --ext .ts,.tsx src",
                },
                keywords: [config.platform, config.type],
                author: {},
                license: "MIT",
                "size-limit": [
                  {
                    path: "dist/index.js",
                    limit: "15 KB",
                  },
                ],
                devDependencies: {
                  "@rollup/plugin-commonjs": "^14.0.0",
                  "@rollup/plugin-node-resolve": "^8.4.0",
                  "@size-limit/preset-small-lib": "^5.0.1",
                  "@testing-library/jest-dom": "^5.11.1",
                  "@testing-library/react": "^10.4.7",
                  "@types/jest": "^26.0.7",
                  "@types/react": "^17.0.14",
                  "@types/react-dom": "^17.0.9",
                  "@typescript-eslint/eslint-plugin": "^4.28.4",
                  "@typescript-eslint/parser": "^4.28.4",
                  classnames: "^2.2.6",
                  eslint: "^7.5.0",
                  "eslint-config-prettier": "^6.11.0",
                  "eslint-plugin-prettier": "^3.1.4",
                  "eslint-plugin-react": "^7.20.5",
                  jest: "^26.1.0",

                  prettier: "^2.3.2",
                  react: "^17.0.2",
                  "react-dom": "^17.0.2",

                  rollup: "^2.53.3",
                  "rollup-plugin-filesize": "^9.1.1",
                  "rollup-plugin-peer-deps-external": "^2.2.4",
                  "rollup-plugin-terser": "^6.1.0",
                  "rollup-plugin-typescript2": "^0.27.3",
                  "size-limit": "^5.0.1",
                  "ts-jest": "^26.1.4",
                  tslib: "^2.3.0",
                  typescript: "^4.3.5",
                },
                peerDependencies: config.platform == "React" && {
                  react: ">=16.8.0",
                  "react-dom": ">=16.8.0",
                },
              });
              break;
            case "spa":
              break;
            case "cli":
              break;
            default:
              break;
          }
          if (config.needTest) await fs.ensureDir(rootPath + "/test");
          if (config.needPrettier) {
            await fs.outputFile(
              rootPath + "/.prettierrc",
              `{
              "trailingComma": "all",
              "tabWidth": 2,
              "semi": false,
              "singleQuote": true,
              "endOfLine": "auto",
              "printWidth": 120,
              "bracketSpacing": true,
              "arrowParens": "always"
            }`
            );
          }
          if (config.needEslint) {
            const createEsConfig = async (platform) => {
              if (platform === "React") {
                await fs.ensureFile(rootPath + "/.eslintrc.js");
                await fs.outputFile(
                  rootPath + "/.eslintrc.js",
                  `module.exports = {
                "env": {
                  "browser": true,
                  "es2021": true,
                },
                "extends": [
                  'plugin:@typescript-eslint/recommended',
                  'plugin:react/recommended',
                  'plugin:prettier/recommended',
                  'prettier/@typescript-eslint',
                ],
                "parser": '@typescript-eslint/parser',
                "parserOptions": {
                  "ecmaFeatures": { jsx: true },
                  "ecmaVersion": 12,
                  "sourceType": 'module',
                },

                "plugins": ['react', '@typescript-eslint'],
                "rules": {
                  'prettier/prettier': ['error', { endOfLine: 'auto' }],
                  'react/prop-types': 0,
                  'react/jsx-uses-react': 0,
                  'react/react-in-jsx-scope': 0,
                  '@typescript-eslint/no-explicit-any': 'off',
                  '@typescript-eslint/explicit-module-boundary-types': 'off',
                  '@typescript-eslint/no-unused-vars': 'off',
                },
                "settings": {
                  "react": {
                    "version": 'detect',
                  },
                },
              }
              `
                );
              }
            };
            switch (config.platform) {
              case "React":
                createEsConfig("React");
                break;

              default:
                break;
            }
          }

          spinner.succeed("success!");
          console.log(
            boxen("ROUE", {
              borderColor: "#22577A",
              float: "center",
              align: "center",
              padding: 1,
            })
          );
        } catch (err) {
          spinner.fail("error!");
        }
      }
    }
  })();
}
