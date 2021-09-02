#! /usr/bin/env node
import prompts from "prompts";
import parseArgv from "minimist";
import fs from "fs-extra";
import ora from "ora";
const argv = parseArgv(process.argv.slice(2));
{
  (async () => {
    if (argv._.length != 0) {
      const command = argv._[0];
      const libName = argv._[1];
      if (command == "create" && libName) {
        const template = argv.template;

        const questions = [
          {
            type: "confirm",
            name: "needEslint",
            message: "Can you need eslint?",
            active: "yes",
          },
          {
            type: "confirm",
            name: "needPrettier",
            message: "Can you need prettier?",
          },
          {
            ...(template || {
              type: "select",
              name: "platform",
              message: "Which platform do you want to build a library for",
              choices: [
                {
                  title: "React",
                  value: "React",
                },
              ],
            }),
          },
        ];

        const config = await prompts(questions);
        const spinner = ora("create files...").start();
        try {
          await fs.ensureDir(libName);
          spinner.succeed("success!");
        } catch (err) {
          console.error(err);
        }
      }
    }
  })();
}
