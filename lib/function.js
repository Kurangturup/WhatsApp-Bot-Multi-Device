/*
Information:
- Developer: Dani
- Version: 1.0.0
- Programming language: JavaScript
- Runtime environment: Node.Js
- Libraries: Baileys
- Created on: July 12, 2023

Donate:
- Dana: 0882 9633 9947
- GoPay: 0895 1254 5999

Thanks to:
- Adiwajshing (Baileys provider)
- WhiskeySockets (Baileys provider)
- Dani Tech. (Dani Ramdani - FullStack Engineer & Developer)
*/

const { proto, getContentType } = require('@whiskeysockets/baileys');
const jimp = require('jimp');

exports.smsg = (client, messages, store) => {
  if (!messages) return messages;
  let M = proto.WebMessageInfo;
  if (messages.key) {
    messages.id = messages.key.id;
    messages.isBaileys = messages.id.startsWith('BAE5') && messages.id.length === 16;
    messages.chat = messages.key.remoteJid;
    messages.fromMe = messages.key.fromMe;
    messages.isGroup = messages.chat.endsWith('@g.us');
    messages.sender = client.decodeJid(messages.fromMe && client.user.id || messages.participant || messages.key.participant || messages.chat || '');
    if (messages.isGroup) messages.participant = client.decodeJid(messages.key.participant) || '';
  }
  if (messages.message) {
    messages.mtype = getContentType(messages.message);
    messages.msg = (messages.mtype == 'viewOnceMessage' ? messages.message[messages.mtype].message[getContentType(messages.message[messages.mtype].message)] : messages.message[messages.mtype]);
    messages.body = messages.message.conversation || messages.msg.caption || messages.msg.text || (messages.mtype == 'listResponseMessage') && messages.msg.singleSelectReply.selectedRowId || (messages.mtype == 'buttonsResponseMessage') && messages.msg.selectedButtonId || (messages.mtype == 'viewOnceMessage') && messages.msg.caption || messages.text;
    let quoted = messages.quoted = messages.msg.contextInfo ? messages.msg.contextInfo.quotedMessage : null;
    messages.mentionedJid = messages.msg.contextInfo ? messages.msg.contextInfo.mentionedJid : [];
    if (messages.quoted) {
      let type = getContentType(quoted);
      messages.quoted = messages.quoted[type];
      if (['productMessage'].includes(type)) {
        type = getContentType(messages.quoted);
        messages.quoted = messages.quoted[type];
      }
      if (typeof messages.quoted === 'string') messages.quoted = {
        text: messages.quoted
      };
      messages.quoted.mtype = type;
      messages.quoted.id = messages.msg.contextInfo.stanzaId;
      messages.quoted.chat = messages.msg.contextInfo.remoteJid || messages.chat;
      messages.quoted.isBaileys = messages.quoted.id ? messages.quoted.id.startsWith('BAE5') && messages.quoted.id.length === 16 : false;
      messages.quoted.sender = client.decodeJid(messages.msg.contextInfo.participant);
      messages.quoted.fromMe = messages.quoted.sender === (client.user && client.user.id);
      messages.quoted.text = messages.quoted.text || messages.quoted.caption || messages.quoted.conversation || messages.quoted.contentText || messages.quoted.selectedDisplayText || messages.quoted.title || '';
      messages.quoted.mentionedJid = messages.msg.contextInfo ? messages.msg.contextInfo.mentionedJid : [];
      messages.getQuotedObj = messages.getQuotedMessage = async () => {
        if (!messages.quoted.id) return false;
        let q = await store.loadMessage(messages.chat, messages.quoted.id, client);
        return exports.smsg(client, q, store);
      };
      let vM = messages.quoted.fakeObj = messages.fromObject({
        key: {
          remoteJid: messages.quoted.chat,
          fromMe: messages.quoted.fromMe,
          id: messages.quoted.id
        },
        message: quoted,
        ...(messages.isGroup ? { participant: messages.quoted.sender } : {})
      });
    }
  }
  messages.reply = (text, chatId = messages.chat, options = {}) => Buffer.isBuffer(text) ? client.sendMedia(chatId, text, 'file', '', m, { ...options }) : client.sendText(chatId, text, messages, { ...options });
  return messages;
};

exports.reSize = async (img, size, size2) => {
  return new Promise(async (resolve, reject) => {
    try {
      const buffer = await jimp.read(img);
      const ab = await buffer.resize(size, size2).getBufferAsync(jimp.MIME_JPEG);
      resolve(ab);
    } catch (error) {
      reject(error);
    }
  });
};