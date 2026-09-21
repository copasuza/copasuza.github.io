function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: "Copa Suza registration endpoint is active."
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tokens = getOrCreateSheet_(ss, "Tokens");
    const registrations = getOrCreateSheet_(ss, "ثبت‌نام‌ها");

    setupTokensHeader_(tokens);
    setupRegistrationsHeader_(registrations);

    const accessToken = String(data.access_token || "").trim();
    const teamName = String(data.team_name || "").trim();

    if (!accessToken || !teamName) {
      return json_({success:false, message:"لینک ثبت‌نام معتبر نیست."});
    }

    const tokenInfo = findToken_(tokens, accessToken);
    if (!tokenInfo) {
      return json_({success:false, message:"کد دسترسی نامعتبر است."});
    }

    if (tokenInfo.used === "بله") {
      return json_({success:false, message:"این لینک قبلاً برای ثبت اطلاعات استفاده شده است."});
    }

    if (tokenInfo.team !== teamName) {
      return json_({success:false, message:"این لینک متعلق به این تیم نیست."});
    }

    const players = Array.isArray(data.players) ? data.players : [];
    if (players.length !== 12) {
      return json_({success:false, message:"اطلاعات ۱۲ بازیکن باید تکمیل شود."});
    }

    const row = [
      new Date(),
      tokenInfo.edition,
      teamName,
      String(data.head_coach || "").trim(),
      String(data.coach || "").trim(),
      String(data.manager || "").trim(),
      String(data.medic || "").trim()
    ];

    players.forEach(function(player) {
      row.push(String(player.full_name || "").trim());
      row.push(String(player.father_name || "").trim());
    });

    row.push("در انتظار بررسی");
    row.push(accessToken);

    registrations.appendRow(row);

    tokens.getRange(tokenInfo.row, 4).setValue("بله");
    tokens.getRange(tokenInfo.row, 5).setValue(new Date());

    return json_({
      success:true,
      message:"اطلاعات تیم با موفقیت ثبت شد.",
      reference:"KS-" + Utilities.getUuid().slice(0,8).toUpperCase()
    });

  } catch (error) {
    return json_({
      success:false,
      message:"خطایی هنگام ثبت اطلاعات رخ داد.",
      error:String(error)
    });
  }
}

function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function setupTokensHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["تورنمنت","نام تیم","کد دسترسی","استفاده شده","تاریخ استفاده"]);
  }
}

function setupRegistrationsHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    const headers = [
      "تاریخ ثبت","تورنمنت","نام تیم","سرمربی","مربی","سرپرست","پزشکیار"
    ];
    for (let i = 1; i <= 12; i++) {
      headers.push("بازیکن " + i);
      headers.push("نام پدر " + i);
    }
    headers.push("وضعیت","کد دسترسی");
    sheet.appendRow(headers);
  }
}

function findToken_(sheet, token) {
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][2]).trim() === token) {
      return {
        row: i + 1,
        edition: String(values[i][0]).trim(),
        team: String(values[i][1]).trim(),
        used: String(values[i][3]).trim()
      };
    }
  }
  return null;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
