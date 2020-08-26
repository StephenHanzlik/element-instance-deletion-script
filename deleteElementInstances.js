const prompt = require('prompt');
const fetch = require('node-fetch');

const envs = {
    "us-production": 'https://api.cloud-elements.com',
    "uk-production": 'https://api.cloud-elements.co.uk',
    "staging": 'https://staging.cloud-elements.com'
}

let deleteSuccesCounter = 0;
let deleteFailedCounter = 0;
let instancesToDelete = [];

console.log("");
console.log("Please enter the following information to DELETE all Element Instances")

prompt.start();
prompt.get(['Environment (staging, us-production, uk-production)', 'User Secret', 'Organization Secret'], (err, result) => {
    const environment = envs[result['Environment (staging, us-production, uk-production)']];
    const authHeader = `User ${result['User Secret']}, Organization ${result['Organization Secret']}`;

    console.log("");
    console.log(`******************************  WARNING!  *********************************************`);
    console.log(`You are about to delete all instances in environment: ${environment}`);
    console.log(`Using Authorization Header: ${authHeader}`);
    console.log(`***************************************************************************************`);
    console.log("");

    console.log('Do you want to proceed?');

    prompt.get([`Enter 'yes' to proceed`], async (err, result) => {

        if (result[`Enter 'yes' to proceed`].toLowerCase() !== 'yes') return console.log('Aborting...');

        console.log("");
        console.log("Fetching instances...");

        let instances = await getInstances(environment, authHeader).catch(err => console.log("ERROR!:", err));

        console.log(`Deleting ${instances.length} instances...`);

        for (let i = 0; i < instances.length; i++) {
            let instanceId = instances[i];
            let resp = await deleteInstances(instanceId, environment, authHeader).catch(err => console.log(`ERROR!:`, err));
            resp.ok ? deleteSuccesCounter++ : await handleDeleteError(resp, instanceId);
        }
        console.log("");
        console.log('******************************   FINISHED  ******************************') 
        console.log(`${deleteSuccesCounter} successful deletions`);
        console.log(`${deleteFailedCounter} failures to delete`);
        console.log(`*************************************************************************`);
    })
});

getInstances = async (environment, authHeader, nextPageToken = '') => {
    const options = {
        method: 'get',
        headers: {
            'Authorization': authHeader
        }
    };

    let response = await fetch(`${environment}/elements/api-v2/instances?nextPage=${nextPageToken}`, options).catch(err => console.log(`ERROR!:`, err));
    nextPageToken = response.headers.get('elements-next-page-token');
    let jsonBody = await response.json();
    jsonBody.forEach(instance => instancesToDelete.push(instance.id));

    return (nextPageToken ? getInstances(environment, authHeader, nextPageToken) : instancesToDelete);
}

deleteInstances = async (instanceId, environment, authHeader) => {
    const options = {
        'method': 'delete',
        'headers': {
            'Authorization': authHeader
        }
    };

    return await fetch(`${environment}/elements/api-v2/instances/${instanceId}`, options).catch(err => console.log(`ERROR!:`, err));
}

handleDeleteError = async (resp, instanceId) => {
    deleteFailedCounter++;
    console.log("");
    console.log(`Failed to DELETE element instance ${instanceId}`);
    console.log(await resp.json());
    console.log("");
    console.log("Resuming operation...");
}