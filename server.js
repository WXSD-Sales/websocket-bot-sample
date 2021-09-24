require('dotenv').config();
var webex = require('webex/env');
let mainCard = require('./cards/main.json');

var botId;

function botSetup(){
  webex.people.get("me").then(function(person){
      console.log(person);
      botId = person.id;
      console.log(`Saving BotId:${botId}`);
  }).catch(function(reason) {
      console.error(reason);
      process.exit(1);
  });
}

function sendWebexMessage(roomId, message, card){
  let payload = {
                 "roomId":roomId,
                 "markdown":message
                }
  if(card !== undefined){
    payload.attachments = [
      {
        "contentType": "application/vnd.microsoft.card.adaptive",
        "content": card
      }
    ]
  }
  webex.messages.create(payload).catch((err) => {
    console.log(`error sending message: ${err}`);
    console.log(`payload sent: ${payload}`);
  })
}

function sendResponseMessage(roomId, inputs){
  msg = `>**Name**: ${inputs.card_custom_name_field}  \n`;
  msg += `>**Description**: ${inputs.card_custom_description_field}  \n`;
  msg += `>**Choice**: ${inputs.card_custom_choice_selected}  \n`;
  sendWebexMessage(roomId, msg);
}

function sendHelpMessage(roomId, text){
  msg = `You said, "${text}."  \n`;
  msg += "I'll continue to echo your message, but if you type ```card```, I'll send you an adaptive card.";
  sendWebexMessage(roomId, msg);
}

function eventListener(){
  console.log('connected');
  webex.messages.listen()
    .then(() => {
      console.log('listening to message events');
      webex.messages.on('created', (message) => {
        if(message.actorId != botId){
          console.log('message created event:');
          console.log(message);
          let roomId = message.data.roomId;
          if(message.data.text.toLowerCase() == "card"){
            sendWebexMessage(roomId, "Hello World - Adaptive Card", mainCard);
          } else {
            sendHelpMessage(roomId, message.data.text);
          }
        }//else, we do nothing when we see the bot's own message
      });
    })
    .catch((err) => {
      console.error(`error listening to messages: ${err}`);
    });

  webex.attachmentActions.listen()
    .then(() => {
      console.log('listening to attachmentAction events');
      webex.attachmentActions.on('created', (attachmentAction) => {
        console.log('attachmentAction created event:');
        console.log(attachmentAction);
        let messageId = attachmentAction.data.messageId;
        let roomId = attachmentAction.data.roomId;
        let inputs = attachmentAction.data.inputs;
        if(inputs.card_custom_name_field != ''){
          sendResponseMessage(roomId, inputs);
          webex.messages.remove(messageId); //delete the card after the user submits successfully.
        } else {
          sendWebexMessage(roomId, "Please enter a name and resubmit to continue.");
        }
      });
    })
    .catch((err) => {
      console.error(`error listening to attachmentActions: ${err}`);
    });
}

botSetup();
eventListener();
