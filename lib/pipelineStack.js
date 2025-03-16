"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyPipelineStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const codepipeline = require("aws-cdk-lib/aws-codepipeline");
const codepipeline_actions = require("aws-cdk-lib/aws-codepipeline-actions");
const codebuild = require("aws-cdk-lib/aws-codebuild");
const s3 = require("aws-cdk-lib/aws-s3");
const sns = require("aws-cdk-lib/aws-sns");
class MyPipelineStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const sourceArtifact = new codepipeline.Artifact();
        const webAppArtifact = new codepipeline.Artifact();
        // GitHub Source Action for CDK Repo
        const cdkSourceAction = new codepipeline_actions.GitHubSourceAction({
            actionName: 'CDK_Source',
            owner: 'mshanah98',
            repo: 'mariaCdk',
            branch: 'main',
            oauthToken: aws_cdk_lib_1.SecretValue.secretsManager('GITHUB_TOKEN_SECRET_NAME'),
            output: sourceArtifact,
        });
        // GitHub Source Action for Web App Repo
        const webAppSourceAction = new codepipeline_actions.GitHubSourceAction({
            actionName: 'WebApp_Source',
            owner: 'mshanah98',
            repo: 'mariaWeb',
            branch: 'main',
            oauthToken: aws_cdk_lib_1.SecretValue.secretsManager('GITHUB_TOKEN_SECRET_NAME'),
            output: webAppArtifact,
        });
        // Build Project for Web App
        const webAppBuildProject = new codebuild.PipelineProject(this, 'WebAppBuild', {
            environment: { buildImage: codebuild.LinuxBuildImage.STANDARD_5_0 },
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                phases: {
                    install: { commands: ['npm install'] },
                    build: { commands: ['npm run build'] },
                },
                artifacts: { 'base-directory': 'build', files: ['**/*'] },
            }),
        });
        const webAppBuildAction = new codepipeline_actions.CodeBuildAction({
            actionName: 'Build_WebApp',
            project: webAppBuildProject,
            input: webAppArtifact,
            outputs: [webAppArtifact],
        });
        // Deploy to Beta
        const betaDeployAction = new codepipeline_actions.S3DeployAction({
            actionName: 'DeployBeta',
            bucket: new s3.Bucket(this, 'BetaBucket'),
            input: webAppArtifact,
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
            input: webAppArtifact,
        });
        // Define Pipeline
        new codepipeline.Pipeline(this, 'WebAppDeploymentPipeline', {
            pipelineName: 'WebAppPipeline',
            stages: [
                { stageName: 'CDK_Source', actions: [cdkSourceAction] },
                { stageName: 'WebApp_Source', actions: [webAppSourceAction] },
                { stageName: 'Build_WebApp', actions: [webAppBuildAction] },
                { stageName: 'Deploy_Beta', actions: [betaDeployAction] },
                { stageName: 'Approval', actions: [manualApprovalAction] },
                { stageName: 'Deploy_Production', actions: [prodDeployAction] },
            ],
        });
    }
}
exports.MyPipelineStack = MyPipelineStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmVTdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBpcGVsaW5lU3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBQXlHO0FBRXpHLDZEQUE2RDtBQUM3RCw2RUFBNkU7QUFDN0UsdURBQXVEO0FBQ3ZELHlDQUF5QztBQUV6QywyQ0FBMkM7QUFJM0MsTUFBYSxlQUFnQixTQUFRLG1CQUFLO0lBQ3hDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBa0I7UUFDMUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxjQUFjLEdBQUcsSUFBSSxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbkQsTUFBTSxjQUFjLEdBQUcsSUFBSSxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7UUFFbkQsb0NBQW9DO1FBQ3BDLE1BQU0sZUFBZSxHQUFHLElBQUksb0JBQW9CLENBQUMsa0JBQWtCLENBQUM7WUFDaEUsVUFBVSxFQUFFLFlBQVk7WUFDeEIsS0FBSyxFQUFFLFdBQVc7WUFDbEIsSUFBSSxFQUFFLFVBQVU7WUFDaEIsTUFBTSxFQUFFLE1BQU07WUFDZCxVQUFVLEVBQUUseUJBQVcsQ0FBQyxjQUFjLENBQUMsMEJBQTBCLENBQUM7WUFDbEUsTUFBTSxFQUFFLGNBQWM7U0FDdkIsQ0FBQyxDQUFDO1FBRUgsd0NBQXdDO1FBQzFDLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxrQkFBa0IsQ0FBQztZQUNuRSxVQUFVLEVBQUUsZUFBZTtZQUMzQixLQUFLLEVBQUUsV0FBVztZQUNsQixJQUFJLEVBQUUsVUFBVTtZQUNoQixNQUFNLEVBQUUsTUFBTTtZQUNkLFVBQVUsRUFBRSx5QkFBVyxDQUFDLGNBQWMsQ0FBQywwQkFBMEIsQ0FBQztZQUNsRSxNQUFNLEVBQUUsY0FBYztTQUN2QixDQUFDLENBQUM7UUFFTCw0QkFBNEI7UUFDNUIsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLFNBQVMsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUMxRSxXQUFXLEVBQUUsRUFBRSxVQUFVLEVBQUUsU0FBUyxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUU7WUFDbkUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDO2dCQUN4QyxPQUFPLEVBQUUsS0FBSztnQkFDZCxNQUFNLEVBQUU7b0JBQ04sT0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsYUFBYSxDQUFDLEVBQUU7b0JBQ3RDLEtBQUssRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDLGVBQWUsQ0FBQyxFQUFFO2lCQUN2QztnQkFDRCxTQUFTLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUU7YUFDMUQsQ0FBQztTQUNILENBQUMsQ0FBQztRQUVILE1BQU0saUJBQWlCLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxlQUFlLENBQUM7WUFDakUsVUFBVSxFQUFFLGNBQWM7WUFDMUIsT0FBTyxFQUFFLGtCQUFrQjtZQUMzQixLQUFLLEVBQUUsY0FBYztZQUNyQixPQUFPLEVBQUUsQ0FBQyxjQUFjLENBQUM7U0FDMUIsQ0FBQyxDQUFDO1FBRUgsaUJBQWlCO1FBQ25CLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxjQUFjLENBQUM7WUFDN0QsVUFBVSxFQUFFLFlBQVk7WUFDeEIsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDO1lBQ3pDLEtBQUssRUFBRSxjQUFjO1NBQ3RCLENBQUMsQ0FBQztRQUVILCtEQUErRDtRQUNqRSxNQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBRTNELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQztZQUN6RSxVQUFVLEVBQUUsb0JBQW9CO1lBQ2hDLGlCQUFpQixFQUFFLGFBQWE7WUFDaEMscUJBQXFCLEVBQUUsZ0VBQWdFO1lBQ3ZGLGtCQUFrQixFQUFFLCtDQUErQztTQUNwRSxDQUFDLENBQUM7UUFDRCx1QkFBdUI7UUFDekIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLG9CQUFvQixDQUFDLGNBQWMsQ0FBQztZQUM3RCxVQUFVLEVBQUUsa0JBQWtCO1lBQzlCLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQztZQUN6QyxLQUFLLEVBQUUsY0FBYztTQUN0QixDQUFDLENBQUM7UUFFSCxrQkFBa0I7UUFDbEIsSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSwwQkFBMEIsRUFBRTtZQUMxRCxZQUFZLEVBQUUsZ0JBQWdCO1lBQzlCLE1BQU0sRUFBRTtnQkFDTixFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLENBQUMsZUFBZSxDQUFDLEVBQUU7Z0JBQ3ZELEVBQUUsU0FBUyxFQUFFLGVBQWUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFO2dCQUM3RCxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLENBQUMsaUJBQWlCLENBQUMsRUFBRTtnQkFDM0QsRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBRSxDQUFDLGdCQUFnQixDQUFDLEVBQUU7Z0JBQ3pELEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFO2dCQUMxRCxFQUFFLFNBQVMsRUFBRSxtQkFBbUIsRUFBRSxPQUFPLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO2FBQ2hFO1NBQ0YsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNGO0FBbkZELDBDQW1GQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFN0YWNrLCBTdGFja1Byb3BzLCBTZWNyZXRWYWx1ZSwgU3RhZ2UsIENmbk91dHB1dCwgcGlwZWxpbmVzLCBSZW1vdmFsUG9saWN5IH0gZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuaW1wb3J0ICogYXMgY29kZXBpcGVsaW5lIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2RlcGlwZWxpbmUnO1xyXG5pbXBvcnQgKiBhcyBjb2RlcGlwZWxpbmVfYWN0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29kZXBpcGVsaW5lLWFjdGlvbnMnO1xyXG5pbXBvcnQgKiBhcyBjb2RlYnVpbGQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZGVidWlsZCc7XHJcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XHJcbmltcG9ydCB7IFBpcGVsaW5lLCBBcnRpZmFjdCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2RlcGlwZWxpbmUnO1xyXG5pbXBvcnQgKiBhcyBzbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucyc7XHJcbmltcG9ydCB7IEdpdEh1YlNvdXJjZUFjdGlvbiwgTWFudWFsQXBwcm92YWxBY3Rpb24sIENsb3VkRm9ybWF0aW9uQ3JlYXRlVXBkYXRlU3RhY2tBY3Rpb24gfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29kZXBpcGVsaW5lLWFjdGlvbnMnO1xyXG5pbXBvcnQgeyBMaW51eEJ1aWxkSW1hZ2UgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29kZWJ1aWxkJztcclxuXHJcbmV4cG9ydCBjbGFzcyBNeVBpcGVsaW5lU3RhY2sgZXh0ZW5kcyBTdGFjayB7XHJcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XHJcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcclxuXHJcbiAgICBjb25zdCBzb3VyY2VBcnRpZmFjdCA9IG5ldyBjb2RlcGlwZWxpbmUuQXJ0aWZhY3QoKTtcclxuICAgIGNvbnN0IHdlYkFwcEFydGlmYWN0ID0gbmV3IGNvZGVwaXBlbGluZS5BcnRpZmFjdCgpO1xyXG5cclxuICAgIC8vIEdpdEh1YiBTb3VyY2UgQWN0aW9uIGZvciBDREsgUmVwb1xyXG4gICAgY29uc3QgY2RrU291cmNlQWN0aW9uID0gbmV3IGNvZGVwaXBlbGluZV9hY3Rpb25zLkdpdEh1YlNvdXJjZUFjdGlvbih7XHJcbiAgICAgICAgYWN0aW9uTmFtZTogJ0NES19Tb3VyY2UnLFxyXG4gICAgICAgIG93bmVyOiAnbXNoYW5haDk4JyxcclxuICAgICAgICByZXBvOiAnbWFyaWFDZGsnLFxyXG4gICAgICAgIGJyYW5jaDogJ21haW4nLFxyXG4gICAgICAgIG9hdXRoVG9rZW46IFNlY3JldFZhbHVlLnNlY3JldHNNYW5hZ2VyKCdHSVRIVUJfVE9LRU5fU0VDUkVUX05BTUUnKSxcclxuICAgICAgICBvdXRwdXQ6IHNvdXJjZUFydGlmYWN0LFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIEdpdEh1YiBTb3VyY2UgQWN0aW9uIGZvciBXZWIgQXBwIFJlcG9cclxuICAgIGNvbnN0IHdlYkFwcFNvdXJjZUFjdGlvbiA9IG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5HaXRIdWJTb3VyY2VBY3Rpb24oe1xyXG4gICAgICAgIGFjdGlvbk5hbWU6ICdXZWJBcHBfU291cmNlJyxcclxuICAgICAgICBvd25lcjogJ21zaGFuYWg5OCcsXHJcbiAgICAgICAgcmVwbzogJ21hcmlhV2ViJyxcclxuICAgICAgICBicmFuY2g6ICdtYWluJyxcclxuICAgICAgICBvYXV0aFRva2VuOiBTZWNyZXRWYWx1ZS5zZWNyZXRzTWFuYWdlcignR0lUSFVCX1RPS0VOX1NFQ1JFVF9OQU1FJyksXHJcbiAgICAgICAgb3V0cHV0OiB3ZWJBcHBBcnRpZmFjdCxcclxuICAgICAgfSk7XHJcblxyXG4gICAgLy8gQnVpbGQgUHJvamVjdCBmb3IgV2ViIEFwcFxyXG4gICAgY29uc3Qgd2ViQXBwQnVpbGRQcm9qZWN0ID0gbmV3IGNvZGVidWlsZC5QaXBlbGluZVByb2plY3QodGhpcywgJ1dlYkFwcEJ1aWxkJywge1xyXG4gICAgICAgIGVudmlyb25tZW50OiB7IGJ1aWxkSW1hZ2U6IGNvZGVidWlsZC5MaW51eEJ1aWxkSW1hZ2UuU1RBTkRBUkRfNV8wIH0sXHJcbiAgICAgICAgYnVpbGRTcGVjOiBjb2RlYnVpbGQuQnVpbGRTcGVjLmZyb21PYmplY3Qoe1xyXG4gICAgICAgICAgdmVyc2lvbjogJzAuMicsXHJcbiAgICAgICAgICBwaGFzZXM6IHtcclxuICAgICAgICAgICAgaW5zdGFsbDogeyBjb21tYW5kczogWyducG0gaW5zdGFsbCddIH0sXHJcbiAgICAgICAgICAgIGJ1aWxkOiB7IGNvbW1hbmRzOiBbJ25wbSBydW4gYnVpbGQnXSB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGFydGlmYWN0czogeyAnYmFzZS1kaXJlY3RvcnknOiAnYnVpbGQnLCBmaWxlczogWycqKi8qJ10gfSxcclxuICAgICAgICB9KSxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBjb25zdCB3ZWJBcHBCdWlsZEFjdGlvbiA9IG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5Db2RlQnVpbGRBY3Rpb24oe1xyXG4gICAgICAgIGFjdGlvbk5hbWU6ICdCdWlsZF9XZWJBcHAnLFxyXG4gICAgICAgIHByb2plY3Q6IHdlYkFwcEJ1aWxkUHJvamVjdCxcclxuICAgICAgICBpbnB1dDogd2ViQXBwQXJ0aWZhY3QsXHJcbiAgICAgICAgb3V0cHV0czogW3dlYkFwcEFydGlmYWN0XSxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICAvLyBEZXBsb3kgdG8gQmV0YVxyXG4gICAgY29uc3QgYmV0YURlcGxveUFjdGlvbiA9IG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5TM0RlcGxveUFjdGlvbih7XHJcbiAgICAgICAgYWN0aW9uTmFtZTogJ0RlcGxveUJldGEnLFxyXG4gICAgICAgIGJ1Y2tldDogbmV3IHMzLkJ1Y2tldCh0aGlzLCAnQmV0YUJ1Y2tldCcpLFxyXG4gICAgICAgIGlucHV0OiB3ZWJBcHBBcnRpZmFjdCxcclxuICAgICAgfSk7XHJcbiAgXHJcbiAgICAgIC8vIE1hbnVhbCBBcHByb3ZhbCBTTlMgVG9waWMgKE9wdGlvbmFsIGZvciBFbWFpbCBOb3RpZmljYXRpb25zKVxyXG4gICAgY29uc3QgYXBwcm92YWxUb3BpYyA9IG5ldyBzbnMuVG9waWModGhpcywgJ0FwcHJvdmFsVG9waWMnKTtcclxuXHJcbiAgICBjb25zdCBtYW51YWxBcHByb3ZhbEFjdGlvbiA9IG5ldyBjb2RlcGlwZWxpbmVfYWN0aW9ucy5NYW51YWxBcHByb3ZhbEFjdGlvbih7XHJcbiAgICAgIGFjdGlvbk5hbWU6ICdBcHByb3ZlX1Byb2R1Y3Rpb24nLFxyXG4gICAgICBub3RpZmljYXRpb25Ub3BpYzogYXBwcm92YWxUb3BpYyxcclxuICAgICAgYWRkaXRpb25hbEluZm9ybWF0aW9uOiAnUGxlYXNlIHJldmlldyB0aGUgQmV0YSBkZXBsb3ltZW50IGJlZm9yZSBhcHByb3ZpbmcgcHJvZHVjdGlvbi4nLFxyXG4gICAgICBleHRlcm5hbEVudGl0eUxpbms6ICdodHRwczovL2dpdGh1Yi5jb20vbXNoYW5haDk4L21hcmlhV2ViL2FjdGlvbnMnLFxyXG4gICAgfSk7XHJcbiAgICAgIC8vIERlcGxveSB0byBQcm9kdWN0aW9uXHJcbiAgICBjb25zdCBwcm9kRGVwbG95QWN0aW9uID0gbmV3IGNvZGVwaXBlbGluZV9hY3Rpb25zLlMzRGVwbG95QWN0aW9uKHtcclxuICAgICAgICBhY3Rpb25OYW1lOiAnRGVwbG95UHJvZHVjdGlvbicsXHJcbiAgICAgICAgYnVja2V0OiBuZXcgczMuQnVja2V0KHRoaXMsICdQcm9kQnVja2V0JyksXHJcbiAgICAgICAgaW5wdXQ6IHdlYkFwcEFydGlmYWN0LFxyXG4gICAgICB9KTtcclxuICBcclxuICAgICAgLy8gRGVmaW5lIFBpcGVsaW5lXHJcbiAgICAgIG5ldyBjb2RlcGlwZWxpbmUuUGlwZWxpbmUodGhpcywgJ1dlYkFwcERlcGxveW1lbnRQaXBlbGluZScsIHtcclxuICAgICAgICBwaXBlbGluZU5hbWU6ICdXZWJBcHBQaXBlbGluZScsXHJcbiAgICAgICAgc3RhZ2VzOiBbXHJcbiAgICAgICAgICB7IHN0YWdlTmFtZTogJ0NES19Tb3VyY2UnLCBhY3Rpb25zOiBbY2RrU291cmNlQWN0aW9uXSB9LFxyXG4gICAgICAgICAgeyBzdGFnZU5hbWU6ICdXZWJBcHBfU291cmNlJywgYWN0aW9uczogW3dlYkFwcFNvdXJjZUFjdGlvbl0gfSxcclxuICAgICAgICAgIHsgc3RhZ2VOYW1lOiAnQnVpbGRfV2ViQXBwJywgYWN0aW9uczogW3dlYkFwcEJ1aWxkQWN0aW9uXSB9LFxyXG4gICAgICAgICAgeyBzdGFnZU5hbWU6ICdEZXBsb3lfQmV0YScsIGFjdGlvbnM6IFtiZXRhRGVwbG95QWN0aW9uXSB9LFxyXG4gICAgICAgICAgeyBzdGFnZU5hbWU6ICdBcHByb3ZhbCcsIGFjdGlvbnM6IFttYW51YWxBcHByb3ZhbEFjdGlvbl0gfSxcclxuICAgICAgICAgIHsgc3RhZ2VOYW1lOiAnRGVwbG95X1Byb2R1Y3Rpb24nLCBhY3Rpb25zOiBbcHJvZERlcGxveUFjdGlvbl0gfSxcclxuICAgICAgICBdLFxyXG4gICAgICB9KTtcclxuICB9XHJcbn1cclxuIl19