import { App, RemovalPolicy, Stack, StackProps, CfnOutput, aws_cloudfront_origins, aws_iam as iam } from 'aws-cdk-lib'
import * as path from 'path';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

interface WebAppStackProps extends StackProps {
  stage: string;  // 'beta' or 'prod'
}

export class Webstack extends Stack {
  constructor(scope: Construct, id: string, props: WebAppStackProps) {
    super(scope, id, props);

    const siteBucket = new s3.Bucket(this, `WebAppBucket-${props.stage}`, {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: props.stage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: props.stage !== 'prod',
      websiteIndexDocument: 'index.html',
      enforceSSL: true,
    });

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, `WebAppDistribution-${props.stage}`, {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
      },
    });

    // ✅ Add S3 Bucket Policy to Allow CloudFront OAC Access
    siteBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
      resources: [`${siteBucket.bucketArn}/*`],
      conditions: {
        StringEquals: {
          'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`
        }
      }
    }));

    // Deploy web app to S3
    new s3deploy.BucketDeployment(this, `DeployWebApp-${props.stage}`, {
      sources: [s3deploy.Source.asset(path.resolve(__dirname, '../../mariia-site/dist'))], // Make sure React is built before deployment
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Output the distribution URL
    new CfnOutput(this, 'DistributionURL', {
      value: distribution.distributionDomainName,
    });
  }
}
