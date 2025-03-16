import { Stack, StackProps, SecretValue, Stage, CfnOutput, pipelines, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Pipeline, Artifact } from 'aws-cdk-lib/aws-codepipeline';
import * as sns from 'aws-cdk-lib/aws-sns';
import { GitHubSourceAction, ManualApprovalAction, CloudFormationCreateUpdateStackAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild';

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const cdkSourceArtifact = new codepipeline.Artifact();
    const webAppSourceArtifact = new codepipeline.Artifact();
    const webAppBuildArtifact = new codepipeline.Artifact();

    // GitHub Source Action for CDK Repo
    const cdkSourceAction = new codepipeline_actions.GitHubSourceAction({
        actionName: 'CDK_Source',
        owner: 'mshanah98',
        repo: 'mariaCdk',
        branch: 'main',
        oauthToken: SecretValue.secretsManager('GITHUB_TOKEN_SECRET_NAME'),
        output: cdkSourceArtifact,
      });

      // GitHub Source Action for Web App Repo
    const webAppSourceAction = new codepipeline_actions.GitHubSourceAction({
        actionName: 'WebApp_Source',
        owner: 'mshanah98',
        repo: 'mariaWeb',
        branch: 'main',
        oauthToken: SecretValue.secretsManager('GITHUB_TOKEN_SECRET_NAME'),
        output: webAppSourceArtifact,
      });

    // Build Project for Web App
    const webAppBuildProject = new codebuild.PipelineProject(this, 'WebAppBuild', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0, // ✅ Use latest AWS CodeBuild runtime
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'n 18', // ✅ Install Node.js 18
              'npm install',
            ],
          },
          build: {
            commands: ['npm run build'],
          },
        },
        artifacts: {
          'base-directory': 'dist',
          files: ['**/*'],
        },
      }),
    });

      const webAppBuildAction = new codepipeline_actions.CodeBuildAction({
        actionName: 'Build_WebApp',
        project: webAppBuildProject,
        input: webAppSourceArtifact,
        outputs: [webAppBuildArtifact],
      });

      // Deploy to Beta
    const betaDeployAction = new codepipeline_actions.S3DeployAction({
        actionName: 'DeployBeta',
        bucket: new s3.Bucket(this, 'BetaBucket'),
        input: webAppBuildArtifact,
      });
  
      // Manual Approval SNS Topic (Optional for Email Notifications)
    const approvalTopic = new sns.Topic(this, 'ApprovalTopic');

    const manualApprovalAction = new codepipeline_actions.ManualApprovalAction({
      actionName: 'Approve_Production',
      notificationTopic: approvalTopic,
      additionalInformation: 'Please review the Beta deployment before approving production.',
      externalEntityLink: 'https://github.com/mshanah98/mariaWeb/actions',
    });
      // Deploy to Production
    const prodDeployAction = new codepipeline_actions.S3DeployAction({
        actionName: 'DeployProduction',
        bucket: new s3.Bucket(this, 'ProdBucket'),
        input: webAppBuildArtifact,
      });
  
      // Define the pipeline stages
    new codepipeline.Pipeline(this, 'WebAppDeploymentPipeline', {
      pipelineName: 'WebAppPipeline',
      pipelineType: codepipeline.PipelineType.V2,
      stages: [
        {
          stageName: 'Source',
          actions: [cdkSourceAction, webAppSourceAction], // ✅ Both source actions in the first stage
        },
        {
          stageName: 'Build',
          actions: [webAppBuildAction], // ✅ Uses separate output artifact
        },
        {
          stageName: 'Deploy_Beta',
          actions: [betaDeployAction],
        },
        {
          stageName: 'Approval',
          actions: [manualApprovalAction],
        },
        {
          stageName: 'Deploy_Production',
          actions: [prodDeployAction],
        },
      ],
    });
  }
}
