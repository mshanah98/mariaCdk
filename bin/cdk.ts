#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Webstack } from '../lib/webStack';
import { PipelineStack } from '../lib/pipelineStack';

const app = new cdk.App();

// Set environments
const envBeta = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-west-2' };
const envProd = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' };

// Register the stacks
new Webstack(app, 'WebAppStack-Beta', { env: envBeta, stage: 'beta' });
new Webstack(app, 'WebAppStack-Prod', { env: envProd, stage: 'prod' });
new PipelineStack(app, 'PipelineStack', { env: envBeta }); // Pipeline is deployed in Beta region

app.synth();