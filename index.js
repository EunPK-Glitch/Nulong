const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// บอทออนไลน์
client.once('ready', () => {
  console.log('NuLong online!');
});

// --- ฟังก์ชันช่วยเหลือ ---

// ฟังก์ชันทอยเต๋า
function rollDice(count, sides) {
  let rolls = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
    total += roll;
  }
  return { rolls, total };
}

// สุ่มข้อความ
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- ชุดข้อความบทพูด (ไม่แก้บทพูดตามรีเควสต์) ---

const critMessages = [
  'Oh my Hachiban!',
  "God's favorite child, huh?",
  'Lucky bastard',
  'Suffering from success?'
];

const failMessages = [
  'Start praying, bro.',
  'Go visit a temple.',
  'See the Yama yet?',
  'The universe hates you.'
];

const cursedKeywords = ['ตอก', 'เด้า', 'กูน', 'สี้', 'เย', 'เย็ด'];

const longKeywords = [
  'หลง', 'อวิ๋นหลง', 'หนูหลง', 'หนูอวิ๋นหลง', 'น้องอวิ๋นหลง',
  'พี่อวิ๋นหลง', 'เฮียอวิ๋นหลง', 'เฮียหลง', 'น้องหลง',
  'โรลหลง', 'โรลเลมหลง', 'โรลเล็มหลง'
];

const longReactions = [
  '...What exactly are you attempting to accomplish?',
  'I regret being capable of reading.',
  'The heavens did not need to witness this.',
  'Your fate concerns me.',
  'I will pretend I did not see that.',
  'You people are exhausting.'
];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// --- เริ่มทำงานเมื่อมีข้อความ ---

client.on('messageCreate', async (message) => {
  // กันบอทคุยกับบอท แต่ยอมให้ Webhook (Tupperbox) ใช้งานได้
  if (message.author.bot || message.webhookId) return;

  const msg = message.content.trim();

  // ต้องขึ้นต้นด้วย n หรือ N
  // จับคำสั่งที่ขึ้นต้นด้วย n หรืออยู่ในวงเล็บ [n ...]
  let found = msg.match(/^n\s+(.+)/i);
  if (!found) {
    found = msg.match(/\[n\s+([^\]]+)\]/i);
  }
  if (!found) return;

  let fullCommand = found[1].trim();
  let command = '';
  let flavorText = '';

  if (fullCommand.includes('"')) {
    // กรณีที่คนครอบเครื่องหมายคำพูดมา
    const parts = fullCommand.split('"');
    command = parts[0].trim();
    flavorText = parts[1].trim();
  } else {
    // ถ้าไม่ครอบเครื่องหมายคำพูด ให้จับคำแรกเป็นคำสั่ง (เช่น d100, date) ที่เหลือเป็นคำบรรยาย
    if (fullCommand.toLowerCase().startsWith('choose ') || fullCommand.toLowerCase().startsWith('r')) {
      command = fullCommand; // ยกเว้น choose กับ r ให้จัดการตัวเอง
    } else {
      const parts = fullCommand.split(/\s+/);
      command = parts[0].trim();
      flavorText = parts.slice(1).join(' ').trim(); // จับคำว่า "ตอกหลง" มาไว้ตรงนี้
    }
  }

  // HELP
  if (command === 'help') {
    return message.reply(`👁 **NuLong Help**

I merely deliver the outcome that fate places before you.
Whether the dice favor you or drag you into despair...
that is hardly my responsibility. ^^

━━━━━━━━━━━━━━

🎲 Basic Roll
n d100
n d20+3
n d100>56

🎲 Multiple Rolls
n 3#d100
n 3d20

🧮 Calculator
n r40+57*7

🪙 Oracle Coin
n coin

👁 Oracle Choice
n choose tea | coffee | despair

📆 Oracle Date
n date

━━━━━━━━━━━━━━

Use your fate wisely.
Or recklessly. I truly do not mind.`);
  }

  // COIN
  if (command === 'coin') {
    const result = Math.random() < 0.5 ? 'Heads!' : 'Tails!';
    const title = flavorText ? `👁 Oracle Coin "${flavorText}"` : `👁 Oracle Coin`;
    return message.reply(`${title}\n► ${result}`);
  }

  // CHOOSE
  if (command.startsWith('choose ')) {
    const choices = command
      .slice(7)
      .split('|')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (choices.length < 2) {
      return message.reply('❌ A choice requires more than one path.');
    }

    const result = choices[Math.floor(Math.random() * choices.length)];
    return message.reply(`👁 Oracle Choice\n► ${result}`);
  }

  // DATE
  if (command === 'date') {
    const monthIndex = Math.floor(Math.random() * 12);
    const maxDay = daysInMonth[monthIndex];
    const day = Math.floor(Math.random() * maxDay) + 1;
    
    const title = flavorText ? `📆 Oracle Date "${flavorText}"` : `📆 Oracle Date`;
    return message.reply(`${title}\n► ${day} ${months[monthIndex]}`);
  }

  // CALCULATOR
  if (command.startsWith('r')) {
    const expr = command.slice(1).trim();

    // อนุญาตแค่เลข + - * / ( )
    if (!/^[0-9+\-* /().]+$/.test(expr)) {
      return message.reply('❌ Too many plot twists right now.');
    }

    try {
      // หมายเหตุ: eval มีความเสี่ยงนิดหน่อย แต่กรองด้วย Regex ด้านบนแล้วถือว่าโอเคในระดับนึง
      const result = eval(expr);
      return message.reply(`[ ${result} ] ► ${expr}`);
    } catch {
      return message.reply('❌ Everything is messy AF.');
    }
  }

  // --- ระบบทอยเต๋า ---
  
  let repeat = 1;
  let diceExpr = command;

  // repeat เช่น 3#d100
  if (command.includes('#')) {
    const split = command.split('#');
    repeat = parseInt(split[0]);
    diceExpr = split[1];
  }

  // parse dice
  const match = diceExpr.match(/^(\d*)d(\d+)([+-]\d+)?([<>=])?(\d+)?/i);

  if (!match) {
    return message.reply('❌ What exactly do you want me to do?');
  }

  const diceCount = parseInt(match[1]) || 1;
  const diceSides = parseInt(match[2]);
  const modifier = parseInt(match[3]) || 0;
  const comparator = match[4];
  const target = parseInt(match[5]);

  let output = `🎲 ${fullCommand}\n`;

  for (let r = 0; r < repeat; r++) {
    const result = rollDice(diceCount, diceSides);
    let total = result.total + modifier;
    let success = null;

    if (comparator === '>') success = total > target;
    if (comparator === '<') success = total < target;
    if (comparator === '=') success = total === target;

    // --- โค้ดจัดระเบียบและเรียงแต้มเต๋า (เวอร์ชันสมบูรณ์) ---
    
    // --- โค้ดจัดระเบียบและเรียงแต้มเต๋า (เวอร์ชันแก้บั๊กวงเล็บเบิ้ล) ---
    
    // 1. เรียงลำดับจากมากไปน้อย
    let sortedRolls = [...result.rolls].sort((a, b) => b - a);

    // 2. แปลงแต้มเต๋าโดยเช็คเงื่อนไขทำตัวหนา
    let formattedRolls = sortedRolls.map(roll => {
      // ถ้าเป็นโหมดลูป (#) และในรอบนั้นทอยเต๋ามากกว่า 1 ลูก (เช่น 5#3d20)
      if (command.includes('#') && diceCount > 1) {
        const maxInRoll = Math.max(...result.rolls);
        const minInRoll = Math.min(...result.rolls);
        if (roll === maxInRoll || roll === minInRoll) {
          return `**${roll}**`;
        }
      } else {
        // [โหมดปกติ] หรือ [โหมด # ที่ทอยรอบละลูกเดียว เช่น 5#d20] -> หนาเฉพาะแต้ม 1 หรือ แต้มตันสูงสุด
        if (roll === diceSides || roll === 1) {
          return `**${roll}**`;
        }
      }
      return roll;
    });

    // 3. เริ่มต้นสร้างข้อความที่จะตอบ
    let line = `►[ ${total} ]`;

    // 4. ต่อข้อความรายละเอียด ถ้าทอยมากกว่า 1 ลูก หรือมี Modifier หรือมีเป้าหมายความสำเร็จ
    if (diceCount > 1 || modifier !== 0 || success !== null) {
      line += ` [ ${formattedRolls.join(', ')} ]`;
      
      if (modifier !== 0) {
        line += modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`;
        line += ` = ${total}`;
      }

      if (success !== null) {
        line += success ? ' ►**Success!**' : ' ►**Failure!**';
      }
    } else {
      // กรณีทอยลูกเดียวโดดๆ (เช่น n d100 หรือ 5#d20) แต่ทอยได้ 1 หรือ แต้มตันสูงสุด ให้ทำตัวหนาที่ผลรวมหลักแทน
      if (total === diceSides || total === 1) {
        line = `►[ **${total}** ]`;
      }
    }

    // เงื่อนไขคริติคอล / ดวงแตก (สำหรับทอยลูกเดียว ครั้งเดียว)
    if (repeat === 1 && diceCount === 1) {
      if (result.total === diceSides) {
        line += `\n\n**${randomItem(critMessages)}**`;
      }
      if (result.total === 1) {
        line += `\n\n**${randomItem(failMessages)}**`;
      }
    }

    if (repeat > 1) {
      output += `\n${r + 1}) ${line}`;
    } else {
      output += `\n${line}`;
    }
  }

  // --- Easter Egg ---
  // เช็คข้อความ Flavor text 
  const hasCursed = cursedKeywords.some(word => flavorText.includes(word));
  const hasLong = longKeywords.some(word => flavorText.includes(word));
  
  if (hasCursed && hasLong) {
    output += `\n\n**${randomItem(longReactions)}**`;
  }

  message.reply(output);

});

// ใส่ TOKEN ตรงนี้
client.login(process.env.TOKEN);
