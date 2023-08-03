/* eslint-disable prefer-template */
/* eslint-disable prettier/prettier */

import fetch from "node-fetch";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import { Op } from "sequelize";


export const CreateTrelloTicketService = async function (ticket: any) {
  const limit = 20;
  const pageNumber = 1 ;

  const offset = limit * (+pageNumber - 1);
  const { count, rows: messages } = await Message.findAndCountAll({
    // where: { ticketId },
    // where: {contactid : ticket.contactId},
    limit,
    include: [
      "contact",
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"]
      },
      {
        model: Ticket,
        where: {
          contactId: ticket.contactId,
          whatsappId: ticket.whatsappId,
          queueId: {
            [Op.or]: [ticket.queueId, null],
          },
        },
        required: true,
      }
    ],
    offset,
    order: [["createdAt", "DESC"]]
  });

  let desc = "";

  await messages.reverse().forEach(msg => {

    if (msg.ticket.id === ticket.id) {
      if( msg.fromMe === true){
      desc += String(msg.body) + "\n";
      }else {
        desc += "*" + String(msg.contact.name) + "* : \n " + String(msg.body) + " \n";
      }
    }
  });


  const today = new Date();
  const dueYear =
    String(today.getFullYear()) +
    "-" +
    String(today.getMonth()).padStart(2, "0") +
    "-" +
    String(today.getDay()).padStart(2, "0");
  const dueHour =
    String(today.getHours()).padStart(2, "0") +
    ":" +
    String(today.getMinutes()).padStart(2, "0") +
    ":" +
    String(today.getSeconds()).padStart(2, "0");

  const startDate = new Date(ticket.createdAt);

  const startYear =
    startDate.getFullYear() +
    "-" +
    String(startDate.getMonth()).padStart(2, "0") +
    "-" +
    String(startDate.getDay()).padStart(2, "0");
  const startHour =
    String(startDate.getHours()).padStart(2, "0") +
    ":" +
    String(startDate.getMinutes()).padStart(2, "0") +
    ":" +
    String(startDate.getSeconds()).padStart(2, "0");

  const title =
    String(today.getDay()).padStart(2, "0") +
    "/" +
    String(today.getMonth()).padStart(2, "0") +
    "/" +
    String(today.getFullYear()) +
    " " +
    dueHour +
    " " +
    "| ATENDIMENTO WHATSAPP | " +
    ticket.contact.name +
    " | " + ticket.queue.name;
  const trelloTicket = {
    name: title,
    desc: "***Ticket Id:*** " + ticket.id +  " \n ***Whatsapp:*** https://web.whatsapp.com/send?phone="+ ticket.contact.number + " \n   ***EXTRATO DAS MENSAGENS*** \n \n" + desc + "\n **FIM DO ATENDIMENTO** ",
    pos: "0",
    start: startYear + " " + startHour,
    due: dueYear + " " + dueHour,
    dueComplete: "true",
    key: "3a239125606277f2a5a7e28468969899",
    token:
      "ATTA7aaf6d4ce08af097deabce97f7694ed659611b81047df2d8de3c99d6a03970160E71DF51",
    idList: "5cdb5cef339c623a43fddf68",
    idMembers: ticket.user.trelloId,
    idLabels: "64c8f162279a82e7ee45eceb"

  };
  const params = new URLSearchParams(trelloTicket).toString();


  fetch("https://api.trello.com/1/cards?" + params, {
    method: "POST",
    headers: {
      Accept: "application/json"
    }
  })
    .then(response => {
      console.log(`Response: ${response.status} ${response.statusText}`);
      return response.text();
    })
    .then(text => console.log(text))
    .catch(err => console.error(err));
};

export default CreateTrelloTicketService;
