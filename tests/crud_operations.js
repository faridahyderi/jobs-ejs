const Job = require("../models/Job");
const { factory, seed_db ,testUserPassword } = require("../util/seed_db");
const get_chai = require("../util/get_chai");
const { app } = require("../app");


before(async () => {
    const { expect, request } = await get_chai();
    this.test_user = await seed_db();
    
    // Get the login page to extract CSRF token
    let req = request.execute(app).get("/sessions/logon").send();
    let res = await req;
    
    console.log("Response Text:", res.text);  // Log the response to check CSRF token presence
    
    const textNoLineEnd = res.text.replaceAll("\n", "");
    
    // Extract CSRF token from the form
    this.csrfToken = /_csrf"\s+value="(.*?)"/.exec(textNoLineEnd);
    
    if (!this.csrfToken) {
      throw new Error("CSRF Token not found in the response");
    }
    
    // Check that the CSRF token is present and correct
    console.log("Extracted CSRF Token:", this.csrfToken[1]);
    this.csrfToken = this.csrfToken[1];  // Extracted CSRF token value
    
    let cookies = res.headers["set-cookie"];
    this.csrfCookie = cookies.find((element) => element.startsWith("_csrf"));
    this.sessionCookie = cookies.find((element) => element.startsWith("connect.sid"));
    
    if (!this.csrfCookie || !this.sessionCookie) {
      throw new Error("Cookies are not set correctly.");
    }
    
    // Prepare data to post (login)
    const dataToPost = {
      email: this.test_user.email,
      password: testUserPassword,
      _csrf: this.csrfToken,
    };
    
    // Log CSRF token and session cookies before making the login POST request
    console.log("Sending CSRF Token:", this.csrfToken);
    console.log("Cookies:", this.csrfCookie, this.sessionCookie);
    
    // Send the login request
    req = request
      .execute(app)
      .post("/sessions/logon")
      .set("Cookie", `${this.csrfCookie}; ${this.sessionCookie}`)
      .set("content-type", "application/x-www-form-urlencoded")
      .redirects(1)
      .send(dataToPost);
    
    res = await req;
    console.log("Response after login:", res.text);  // Log the entire respons

    // Log the cookies to check if the session cookie is set
console.log("Cookies after login:", res.headers['set-cookie']);

    // Check for redirect status code (should be 3xx for redirect)
  console.log("Status Code after login:", res.status);  // Inspect the status code

  // If redirected, we should check the CSRF token again in the next page
  if (res.status >= 300 && res.status < 400) {
    req = request.execute(app).get(res.headers.location).set("Cookie", res.headers["set-cookie"]).send();
    res = await req;
    const textNoLineEndAfterLogin = res.text.replaceAll("\n", "");
    this.csrfToken = /_csrf"\s+value="(.*?)"/.exec(textNoLineEndAfterLogin);

    if (!this.csrfToken) {
      throw new Error("CSRF Token not found in the response after login redirect");
    }

    console.log("Extracted CSRF Token after login redirect:", this.csrfToken[1]);
    this.csrfToken = this.csrfToken[1]; // Update the CSRF token post-login

    // Check for session cookie after login
    cookies = res.headers["set-cookie"];
    this.sessionCookie = cookies.find((element) => element.startsWith("connect.sid"));
  }

    
    expect(this.csrfToken).to.not.be.undefined;
    expect(this.sessionCookie).to.not.be.undefined;
    expect(this.csrfCookie).to.not.be.undefined;
  });
  
  
  
  
  it("should return 20 jobs", async () => {
    const { expect, request } = await get_chai();
    let res = await request
      .execute(app)
      .get("/jobs")
      .set("Cookie", `${this.csrfCookie}; ${this.sessionCookie}`)
      .send();
    const pageParts = res.text.split("<tr>");
    expect(pageParts.length).to.equal(21); // Including the header row
  });

  it("should add a new job", async () => {
    const { expect, request } = await get_chai();
    const newJob = await factory.build("job");
    // Add createdBy field
    newJob.createdBy = this.test_user._id;
    await newJob.save();  
    console.log("Cookies sent in POST:", this.csrfCookie, this.sessionCookie);
  console.log("CSRF Token sent in POST:", this.csrfToken);



    const dataToPost = {
      title: newJob.title,
      description: newJob.description,
      _csrf: this.csrfToken,
    };
  
    let res = await request
      .execute(app)
      .post("/jobs/create")
      .set("Cookie", `${this.csrfCookie}; ${this.sessionCookie}`)
      .send(dataToPost);
  
    const jobs = await Job.find({ createdBy: this.test_user._id });
    console.log(jobs.length);
    expect(jobs.length).to.equal(21);
  });
  