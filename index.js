import dotenv from 'dotenv';
import { exec, spawn } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';
const execAsync = promisify(exec);

dotenv.config();

const { TYPE, GITHUB_APP_ID, GITHUB_APP_SECRET, REPO_NAME } = process.env;

if(TYPE === "nixpacks") {
  console.log("Nixpacks");
} else {
  console.log("Dockerfile");
}

async function cloneRepo() {
    const cloneCommand = `git clone https://github.com/${REPO_NAME} /builder`;

    await exec(cloneCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`${stdout}`);
        console.error(`${stderr}`);
        afterCloned();
    });

    console.log("Repository cloned successfully");
}

async function afterCloned() {
    const stopContainersCommand = `docker ps -a -q --filter ancestor=${REPO_NAME} | xargs -r docker stop || true`;
    const deleteCommand = `docker ps -a -q --filter ancestor=${REPO_NAME} | xargs -r docker rm && docker rmi ${REPO_NAME} || true`;
    
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
    const buildArgs = ['build', '/builder', '--name', REPO_NAME];

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
    const buildArgs = ['build', '-t', REPO_NAME, '/builder'];

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