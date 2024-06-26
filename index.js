import dotenv from 'dotenv';
import { exec, spawn } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';
const execAsync = promisify(exec);

dotenv.config();

const { TYPE, REPO_NAME, GITHUB_PAT, GITHUB_USERNAME, ID, BASE_DIR } = process.env;

let baseDirectory = "";

if(BASE_DIR !== undefined && BASE_DIR !== null) {
    baseDirectory = BASE_DIR;
}

if(TYPE === "nixpacks") {
  console.log("Nixpacks");
} else {
  console.log("Dockerfile");
}

async function cloneRepo() {
    let cloneCommand = `git clone https://github.com/${REPO_NAME} /builder`;

    if(GITHUB_PAT && GITHUB_USERNAME) {
        cloneCommand = `git clone https://${GITHUB_USERNAME}:${GITHUB_PAT}@github.com/${REPO_NAME} /builder`;
    }

    await exec(cloneCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`${stdout}`);
        console.error(`${stderr}`);
        afterCloned();
    });
}

async function afterCloned() {
    const stopContainersCommand = `docker ps -a -q --filter ancestor=${ID} | xargs -r docker stop || true`;
    const deleteCommand = `docker ps -a -q --filter ancestor=${ID} | xargs -r docker rm && docker rmi ${ID} || true`;

    console.log("Repository cloned successfully");

    try {
        const { stdout: stdoutStop, stderr: stderrStop } = await execAsync(stopContainersCommand);
        console.log(`${stdoutStop}`);
        console.error(`${stderrStop}`);

        const { stdout: stdoutDelete, stderr: stderrDelete } = await execAsync(deleteCommand);
        console.log(`${stdoutDelete}`);
        console.error(`${stderrDelete}`);
    } catch (error) {
        console.error(`exec error: ${error}`);
        return;
    }

    fs.readdirSync('/builder').forEach(file => {
        console.log(file);
    });

    if(TYPE === "nixpacks") {
        console.log("Nixpacks build starting");
        buildWithNixpacks();
    } else {
        console.log("Dockerfile build starting");
        buildWithDockerfile();
    }
}

async function buildWithNixpacks() {
    const buildCommand = 'nixpacks';
    const buildArgs = ['build', `/builder${baseDirectory}`, '--name', ID];

    const buildProcess = spawn(buildCommand, buildArgs);

    buildProcess.stdout.on('data', (data) => {
        console.log(`${data}`);
    });

    buildProcess.stderr.on('data', (data) => {
        console.error(`${data}`);
    });

    buildProcess.on('close', (code) => {
        if (code !== 0) {
            console.log(`build process exited with code ${code}`);
        } else {
            console.log("Build successful via Nixpacks");
        }
    });
}

async function buildWithDockerfile() {
    const buildCommand = `docker`;
    const buildArgs = ['build', '-t', ID, `/builder${baseDirectory}`];

    const buildProcess = spawn(buildCommand, buildArgs);

    buildProcess.stdout.on('data', (data) => {
        console.log(`${data}`);
    });

    buildProcess.stderr.on('data', (data) => {
        console.error(`${data}`);
    });

    buildProcess.on('close', (code) => {
        if (code !== 0) {
            console.log(`build process exited with code ${code}`);
        } else {
            console.log("Build successful via Dockerfile");
        }
    });
}

cloneRepo();