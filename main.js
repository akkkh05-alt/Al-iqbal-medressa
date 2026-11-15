/*
===========================================================================
Welcome to your Cloud Code!
---------------------------------------------------------------------------
In the next sections, you'll see examples of how Parse Cloud Code works.
===========================================================================
*/

// Cloud Functions: Are custom functions that allow to execute logic on the backend.

// If you want, just uncomment the commented function blocks and deploy.
// And use the commented curls in your terminal

Parse.Cloud.define("hello", async (request) => {
    console.log("Hello from Cloud Code!");
    return "Hello from Cloud Code!";
});

// To see it working, you only need to call it through SDK or REST API.
// Here is how you have to call it via REST API:

/* 
curl -X POST \
  -H "X-Parse-Application-Id: c4lt3DT5NU87tcl9RP8EtkpAqiaO2ZSJIwfjvkws" \
  -H "X-Parse-REST-API-Key: FxwsqZalmJY4NiLbsY0Z1GFuRnS9S1AwkYHY8me9" \
  https://parseapi.back4app.com/functions/hello
*/


// This example creates an object in your class.

Parse.Cloud.define("createObject", async (request) => {
  const b4aClass = new Parse.Object("B4aSampleClass");
  b4aClass.set("name", request.params.name);
  b4aClass.set("value", request.params.value);
  await b4aClass.save(null, { useMasterKey: true });
  return "Object created successfully!";
});

// Cloud Triggers: Is a function that automatically runs when certain events happen in your database classes. — such as when an object is saved, updated, deleted, or queried.

Parse.Cloud.beforeSave("B4aSampleClass", (request) => {
  // Set value property to 0 if not send 
  if (request.object.get("value") === undefined) {
    request.object.set("value", 0);
  }
});

// You can use the createObject function created earlier and omit the value property to see the trigger in action.
// The trigger will set the value property with 0

/* 
curl -X POST \
  -H "X-Parse-Application-Id: c4lt3DT5NU87tcl9RP8EtkpAqiaO2ZSJIwfjvkws" \
  -H "X-Parse-REST-API-Key: FxwsqZalmJY4NiLbsY0Z1GFuRnS9S1AwkYHY8me9" \
  -H "Content-Type: application/json" \
  -d '{"name":"b4aObject2"}' \
  https://parseapi.back4app.com/functions/createObject
*/

// Now we can retrieve the object created with this function:

Parse.Cloud.define("getObjects", async (request) => {
  const query = new Parse.Query("B4aSampleClass");
  const objects = await query.find({ useMasterKey: true });

  return objects.map(obj => ({
    id: obj.id,
    name: obj.get("name"),
    value: obj.get("value"),
  }));
});

// Here is how you have to call it via REST API:

/*
curl -X POST \
  -H "X-Parse-Application-Id: c4lt3DT5NU87tcl9RP8EtkpAqiaO2ZSJIwfjvkws" \
  -H "X-Parse-REST-API-Key: FxwsqZalmJY4NiLbsY0Z1GFuRnS9S1AwkYHY8me9" \
  -H "Content-Type: application/json" \
  https://parseapi.back4app.com/functions/getObjects
*/


// Cloud Jobs: Are background routines that can be scheduled or triggered to run automatically, ideal for long-running or maintenance tasks.

Parse.Cloud.job("activeAllObjects", async (request) => {
  const query = new Parse.Query("B4aSampleClass");
  const objects = await query.find({ useMasterKey: true });

  for (const obj of objects) {
    obj.set("isActive", true);
    await obj.save(null, { useMasterKey: true });
  }
});

// This job will add the property 'isActive' to 'true' for all objects
// ** Jobs can be only excute with the Master Key.

// Here is how you have to call it:

/* 
curl -X POST \
  -H "X-Parse-Application-Id: c4lt3DT5NU87tcl9RP8EtkpAqiaO2ZSJIwfjvkws" \
  -H "X-Parse-Master-Key: bmco7vuZEKRGPYITu6zfY5cjoy5Z3TnBXAOWZfwV" \
  https://parseapi.back4app.com/jobs/activeAllObjects
*/


// If you have set a function in another cloud code file, called "test.js" (for example)
// you need to refer it in your main.js, as you can see below:

/* require("./test.js"); */
