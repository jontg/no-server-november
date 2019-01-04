import * as Credstash from 'nodecredstash/js';
import * as JWT from 'jsonwebtoken';
import github_private_key from '../github-check.private-key.pem';
import * as createApp from 'github-app';

const credstash = new Credstash({ awsOpts: { region: process.env.AWS_DEFAULT_REGION } });

const github_app_id = "20599";
const jira_check = /[A-Z]{2,}-[0-9]+:/g;

export const handler = async (event, context, cb) => {
  const started_at = new Date();
  const app = createApp({
    id: github_app_id,
    cert: Buffer.from(github_private_key),
  });

  const payload = JSON.parse(event.body);

  const { action } = payload;
  if (action !== 'requested' ) return cb(null, { statusCode: 204 });

  const {
    check_suite: {
      head_sha,
      head_commit: { message },
    },
    installation: { id : github_installation_id },
    repository: {
      name: repo,
      owner: { login: owner },
    },
  } = payload;

  const integration = await app.asInstallation(github_installation_id);

  let result = await integration.checks.create({
    head_sha, owner, repo,
    name: 'GitHub API Serverless No Server November',
  });

  let { id: check_run_id } = result.data;

  await integration.checks.update({
    check_run_id, owner, repo,
    status: 'in_progress',
    started_at: started_at.toISOString(),
  });

  if ( message.match(jira_check) ) {

    await integration.checks.update({
      check_run_id, owner, repo,
      status: 'completed',
      conclusion: 'success',
      started_at: started_at.toISOString(),
      completed_at: new Date().toISOString(),
    });

  } else {

    await integration.checks.update({
      check_run_id, owner, repo,
      status: 'completed',
      conclusion: 'failure',
      started_at: started_at.toISOString(),
      completed_at: new Date().toISOString(),
    });
  }

  cb(null, { statusCode: 204 });
};
