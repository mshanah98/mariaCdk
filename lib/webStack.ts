import { App, RemovalPolicy, Stack, StackProps, CfnOutput, aws_iam as iam, aws_ssm as ssm } from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';
import { BlockPublicAccess, Bucket, CfnBucketPolicy } from 'aws-cdk-lib/aws-s3';
import { Distribution, S3OriginAccessControl, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Source } from 'aws-cdk-lib/aws-s3-deployment';
import { BucketDeployment } from 'aws-cdk-lib/aws-s3-deployment';

interface WebAppStackProps extends StackProps {
  stage: string;  // 'beta' or 'prod'
}

export class Webstack extends Stack {
  public readonly siteBucket: Bucket;

  constructor(scope: Construct, id: string, props: WebAppStackProps) {
    super(scope, id, props);

    // ✅ 1️⃣ Create the S3 Bucket First
    const siteBucket = new Bucket(this, `WebAppBucket-${props.stage}`, {
      bucketName: `mariia-webapp-${props.stage}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: props.stage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: props.stage !== 'prod',
      enforceSSL: true,
    });

    // 2. Create a CloudFront distribution with OAC
    const distribution = new Distribution(this, 'MyDistribution', {
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(siteBucket, {
          originAccessControl: new S3OriginAccessControl(this, 'MyOAC'),
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html', // Or your desired default file
    });

    // ✅ 6️⃣ Deploy Web App to S3
    new BucketDeployment(this, `DeployWebApp-${props.stage}`, {
      sources: [Source.asset(path.resolve(__dirname, '../../mariia-site/dist'))], // Ensure React is built before deployment
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });
    this.siteBucket = siteBucket;
  }
}
