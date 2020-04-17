#!/usr/bin/env node

import * as fs from "fs";

import { format } from "./format";

const [, , ...args] = process.argv;

function run() {
    if (args.length !== 1) {
        console.log(args.length);
        console.error("Usage: setanta-hl <file>");
        process.exitCode = 1;
        return;
    }
    const input = fs.readFileSync(args[0], { encoding: "utf8" });
    const lines = input.split("\n");
    const out: string[] = [];

    let block: string[] = [];

    let inBlock = false;
    for (const line of lines) {
        if (line === "```setanta") {
            inBlock = true;
        } else if (inBlock && line === "```") {
            inBlock = false;

            try {
                const fmt = format(block.join("\n"));
                out.push(...fmt.split("\n"));
            } catch (e) {
                console.error(e);
                process.exitCode = 1;
                return;
            }

            block = [];
        } else {
            if (inBlock) {
                block.push(line);
            } else {
                out.push(line);
            }
        }
    }

    fs.writeFileSync(args[0], out.join("\n"));
}

run();
