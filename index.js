const { WebClient } = require('@slack/web-api');
const { createBuildResultMsg, createEcsDeployResultMsg, createCloudFrontDeployResultMsg } = require('./utility/message')
const { shouldInvaliCompleted } = require("./service")

const web = new WebClient(process.env.SLACK_OAUTH_TOKEN);

exports.handler = async (event) => {
    let msgObj;
    const statusCode = { statusCode: 200 }

    // Cloud Trail Event Object
    if (event.eventSource) {
        const result = await shouldInvaliCompleted(event.responseElements);
        msgObj = createCloudFrontDeployResultMsg(result);
    } else {
        switch (event["detail-type"]) {
            case "CodeBuild Build State Change":
                msgObj = createBuildResultMsg(event);
                break;
            case "ECS Deployment State Change":
                msgObj = createEcsDeployResultMsg(event);
                break;
        }
    }

    if (event.detail.eventName === "SERVICE_DEPLOYMENT_IN_PROGRESS") {
        const response = {
            ...statusCode,
            body: "ECS Service deployment in progress. Not run slack notification.",
        };
        return response;
    } else {
        const result = await web.chat.postMessage({
            ...msgObj,
            channel: process.env.SLACK_CHANNNEL_ID
        });
        const response = {
            ...statusCode,
            body: `Successfully send message ${result.ts}`,
        };

        return response;
    }
}