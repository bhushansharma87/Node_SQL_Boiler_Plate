const { Template } = require("../config/database").db;

async function getHtmlContent(templateName, replaceData) {
  //Generate rows for each item in the order
  return await Template.findOne({
    where: {
      slug: templateName,
    },
  }).then((template) => {
    const data = template.dataValues.content;

    let html = data.toString();
    Object.keys(replaceData).forEach((key) => {
      const placeholder = new RegExp(`\\$\\{${key}\\}`, "g"); // Create a regex to match the placeholder
      html = html.replace(placeholder, replaceData[key]);
    });
    return html;
  });
}

module.exports = {
  getHtmlContent,
};
