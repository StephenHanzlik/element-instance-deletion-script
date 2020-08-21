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
// let nextPageToken = '';
let instancesToDelete = [];

prompt.start();
prompt.get(['Environment (staging, us-production, uk-production)', 'User Secret', 'Organization Secret'], (err, result) => {
    const environment = "https://api.cloud-elements.com";
    //envs[result['Environment (staging, us-production, uk-production)']];
    const authHeader = "User BvYv31mpHgWPI9/rAa2DLUETuLWi/GWbhYar96d/KhM=, Organization BkdiwEGHKCV9RT3JEfJKGfh/LQBHXmoAJWyP4KOnGvI=";
    // `User ${result['User Secret']}, Organization ${result['Organization Secret']}`;

    console.log(`WARNING!  You are about to delete all instances in environment: ${environment}`);
    console.log(`Using Authorization Header: ${authHeader}`);
    console.log('Do you want to proceed?');

    prompt.get([`Enter 'yes' to proceed`], async (err, result) => {

        if (result[`Enter 'yes' to proceed`].toLowerCase() !== 'yes') return console.log('Aborting...');

        console.log("Fetching instances...");

        let instances = await getInstances(environment, authHeader).catch (err=> console.log("ERROR!:", err))
        // .then(instances => {

        console.log(`Deleting ${instances.length} instances...`);

        // asyncForEach(instances, environment, authHeader, async (id) => {
        for (let i = 0; i < instances.length; i++) {
            let instanceId = instances[i];
            console.log("DEBUG LOGGING - Looping instanceId=", instanceId);
            let resp = await deleteInstances(instanceId, environment, authHeader).catch(err => console.log(`Error Deleting Instance ${id}`, resp.message))
            console.log("DEBUG LOGGING - Promise resolved for instanceId=", instanceId);
            resp.ok ? deleteSuccesCounter++ : deleteFailedCounter++;
        }
        // });
        console.log(`Successfully Deleted ${deleteSuccesCounter} Instances`);
        console.log(`Failed to delete ${deleteFailedCounter} Instances`);
            // })
            // .catch (err=> console.log("ERROR!:", err))
})
});

// async function getInstances(environment, authHeader, nextPageToken = '') {
getInstances = (environment, authHeader, nextPageToken = '') => {
    const options = {
        method: 'get',
        headers: {
            'Authorization': authHeader
        }
    };

    // let nextPageToken;

    return fetch(`${environment}/elements/api-v2/instances?nextPage=${nextPageToken}`, options)
        .then(response => {
            nextPageToken = response.headers.get('elements-next-page-token');
            return response.json();
        })
        .then(json => {
            json.forEach(instance => instancesToDelete.push(instance.id));
            console.log("DEBUG LOGGING - instancesToDelete.length", instancesToDelete.length);
            if (nextPageToken) {
                return getInstances(environment, authHeader, nextPageToken);
            }
            else {
                return instancesToDelete;
            }
        })
        .catch(err => {
            console.log(`ERROR: ${err}`);
        });
}

deleteInstances = async (instanceId, environment, authHeader) => {
    const options = {
        'method': 'delete',
        'headers': {
            'Authorization': authHeader
        }
    };

    return await fetch(`${environment}/elements/api-v2/instances/${instanceId}`, options);
    // .then(response => {
    //     //return 
    //     // deleteSuccesCounter++;
    //     // console.log("Successful delete");
    // })
    // .catch(err => {
    //     //return 
    //     deleteFailedCounter++;
    //     // return console.log(`ERROR: ${err}`);
    // });
}

const asyncForEach = async (array, environment, authHeader, callback) => {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], environment, authHeader);
    }
};