const { app } = require("../app");
const { factory, seed_db } = require("../util/seed_db");
const faker = require("@faker-js/faker").fakerEN_US;
const get_chai = require("../util/get_chai");

const User = require("../models/User");

describe("tests for registration and logon", function () {
    let csrfToken;
    let csrfCookie;
    let sessionCookie;
    let user;
    let password;
  
    // Extract CSRF token and cookies before tests
    before(async function () {
      const { expect, request } = await get_chai();
      
      // Get registration page to extract CSRF token
      const req = request.execute(app).get("/sessions/register").send();
      const res = await req;
    
      expect(res).to.have.status(200);
      expect(res).to.have.property("text");
      expect(res.text).to.include("Enter your name");
    
      // Extract CSRF token from the page (ensure no line breaks)
      const textNoLineEnd = res.text.replaceAll("\n", "");
      const csrfTokenMatch = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd);
      expect(csrfTokenMatch).to.not.be.null;
      csrfToken = csrfTokenMatch[1];
  
      // Extract CSRF cookie from the response headers
      const cookies = res.headers["set-cookie"] || [];
      csrfCookie = cookies.find(cookie => cookie.includes("_csrf"))?.split(";")[0];
  
      // Store CSRF cookie and token for use in other tests
      expect(csrfCookie).to.not.be.undefined;
      global.csrfToken = csrfToken;
      global.csrfCookie = csrfCookie;
  
      console.log("Extracted CSRF Token:", csrfToken);  // Add this log to check
      console.log("Extracted CSRF Cookie:", csrfCookie); // Add this log to check
    });
  
    it("should get the registration page", async function () {
      const { expect, request } = await get_chai();
  
      // Get the registration page to extract CSRF token and cookie
      const res = await request
        .execute(app)
        .get("/sessions/register")
        .send();
  
      // Check the response for successful rendering
      expect(res.status).to.equal(200);
      expect(res.text).to.include("Enter your name");
  
      // Ensure CSRF token and cookie are set correctly in global variables
      expect(global.csrfToken).to.not.be.undefined;
      expect(global.csrfCookie).to.not.be.undefined;
    });
  
    it("should register the user", async function () {
      const { expect, request } = await get_chai();
  
      password = faker.internet.password();
      user = await factory.build("user", { password: password });
  
      const dataToPost = {
        name: user.name,
        email: user.email,
        password: password,
        password1: password,
        _csrf: global.csrfToken,  // Use global CSRF token
      };
  
      // Send registration request
      const res = await request
        .execute(app)
        .post("/sessions/register")
        .set("Cookie", global.csrfCookie)  // Use global CSRF cookie
        .set("content-type", "application/x-www-form-urlencoded")
        .send(dataToPost);
  
      expect(res).to.have.status(200);
      expect(res.text).to.include("Jobs List");
  
      const newUser = await User.findOne({ email: user.email });
      expect(newUser).to.not.be.null;
    });
  
    it("should log the user on", async function () {
      const { expect, request } = await get_chai();
  
      const dataToPost = {
        email: user.email,
        password: password,
        _csrf: global.csrfToken,
      };
  
      const res = await request
        .execute(app)
        .post("/sessions/logon")
        .set("Cookie", global.csrfCookie)  // Use global CSRF cookie
        .set("content-type", "application/x-www-form-urlencoded")
        .redirects(0)
        .send(dataToPost);
  
      expect(res).to.have.status(302);
      expect(res.headers.location).to.equal("/");
  
      const cookies = res.headers["set-cookie"];
      const sessionCookie = cookies.find(cookie => cookie.startsWith("connect.sid"));
      expect(sessionCookie).to.not.be.undefined;
  
      global.sessionCookie = sessionCookie;  // Store session cookie globally
    });
  
    it("should log the user off", async function () {
      const { expect, request } = await get_chai();
  
      const dataToPost = {
        _csrf: global.csrfToken,  // Use global CSRF token
      };
  
      const res = await request
        .execute(app)
        .post("/sessions/logoff")
        .set("Cookie", `${global.csrfCookie}; ${global.sessionCookie}`)  // Use global CSRF and session cookie
        .set("content-type", "application/x-www-form-urlencoded")
        .send(dataToPost);
  
      expect(res).to.have.status(200);
      expect(res.text).to.include("Click this link to logon");
    });
  });
  

  