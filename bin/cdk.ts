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
const webstackBeta = new Webstack(app, 'WebAppStack-Beta', { env: envBeta, stage: 'beta' });
const webstackProd = new Webstack(app, 'WebAppStack-Prod', { env: envProd, stage: 'prod' });
const pipelineStack = new PipelineStack(app, 'PipelineStack', 
    { 
        env: envBeta, 
        betaBucket: webstackBeta.siteBucket, 
        prodBucket: webstackProd.siteBucket 
    });
pipelineStack.addDependency(webstackBeta);
pipelineStack.addDependency(webstackProd);
app.synth();