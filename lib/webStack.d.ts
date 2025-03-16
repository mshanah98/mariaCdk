import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
interface WebAppStackProps extends StackProps {
    stage: string;
}
export declare class Webstack extends Stack {
    constructor(scope: Construct, id: string, props: WebAppStackProps);
}
export {};
