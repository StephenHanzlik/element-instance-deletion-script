//This script was requested by Bottomline and needs to leverage our APIs to delete all element instances in the account.
//Bottomline will run this with each release and have customers reprovision
//This script needs to leverage a GET /instances to get all instance and then loop through and delete them with DELETE /instances
//Make sure to account for more than 200 instances

//Input: Auth Header and Environment
//Output: Deleted element instances
const requestPromise = require('request-promise-native');
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

prompt.start();
prompt.get(['Environment (staging, us-production, uk-production)', 'User Secret', 'Organization Secret'], (err, result) => {
    const environment = "https://api.cloud-elements.com";
    //envs[result['Environment (staging, us-production, uk-production)']];
    const authHeader = "User BvYv31mpHgWPI9/rAa2DLUETuLWi/GWbhYar96d/KhM=, Organization BkdiwEGHKCV9RT3JEfJKGfh/LQBHXmoAJWyP4KOnGvI=";
    // `User ${result['User Secret']}, Organization ${result['Organization Secret']}`;
    console.log("");
    console.log(`******************************  WARNING!  *********************************************`);
    console.log(`You are about to delete all instances in environment: ${environment}`);
    console.log(`Using Authorization Header: ${authHeader}`);
    console.log(`***************************************************************************************`);
    console.log("");

    console.log('Do you want to proceed?');

    prompt.get([`Enter 'yes' to proceed`], async (err, result) => {

        if (result[`Enter 'yes' to proceed`].toLowerCase() !== 'yes') return console.log('Aborting...');

        console.log("Fetching instances...");

        let instances = await getInstances(environment, authHeader).catch(err => console.log("ERROR!:", err));

        console.log(`Deleting ${instances.length} instances...`);

        for (let i = 0; i < instances.length; i++) {
            let instanceId = instances[i];
            let resp = await deleteInstances(instanceId, environment, authHeader).catch(err => console.log(`ERROR!:`, err));
            resp.ok ? deleteSuccesCounter++ : handleDeleteError(resp, instanceId);
        }
        console.log(`Successfully Deleted ${deleteSuccesCounter} Instances`);
        console.log(`Failed to delete ${deleteFailedCounter} Instances`);
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
    // console.log("response.body", response.body);
    // console.log("response type of", typeof response)
    let jsonBody = await response.json();
    jsonBody.forEach(instance => instancesToDelete.push(instance.id));
    return (nextPageToken ? getInstances(environment, authHeader, nextPageToken) : instancesToDelete);


    // return fetch(`${environment}/elements/api-v2/instances?nextPage=${nextPageToken}`, options)
    // .then(response => {
    //     nextPageToken = response.headers.get('elements-next-page-token');
    //     console.log("TYPE OF Response", typeof response);
    //     console.log("response json", response.json());
    //     console.log("response type of 1", response.json());
    //     return response.json();
    // })
    // .then(json => {
    //     console.log("response type of 2", typeof json)
    //     json.forEach(instance => instancesToDelete.push(instance.id));
    //     return (nextPageToken ? getInstances(environment, authHeader, nextPageToken) : instancesToDelete);
    // })
    // .catch(err => {
    //     console.log(`ERROR: ${err}`);
    // });
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
    console.log(`Failed to DELETE element instance ${instanceId}`);
    console.log(await resp.json());
    console.log("Resuming operation...")
}