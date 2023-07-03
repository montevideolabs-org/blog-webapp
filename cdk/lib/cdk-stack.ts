import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

const BASE_DOMAIN = '<YOUR_DOMAIN_HERE>';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'website-bucket', {
      encryption: s3.BucketEncryption.S3_MANAGED
    });

    const hostedZone = route53.HostedZone.fromLookup(this, 'hosted-zone', {
      domainName: BASE_DOMAIN,
    });

    const certificate = new acm.DnsValidatedCertificate(this, 'certificate', {
      domainName: BASE_DOMAIN,
      hostedZone: hostedZone,
      region: 'us-east-1',
    });

    const distribution = new cloudfront.Distribution(this, 'website-distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: [BASE_DOMAIN],
      defaultRootObject: 'index.html',
      certificate: certificate,
    });

    const DNSRecord = new route53.ARecord(this, 'DNSRecord', {
      zone: hostedZone,
      recordName: BASE_DOMAIN,
      target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution)),
    })
  }
}
