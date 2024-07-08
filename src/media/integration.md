<details>
  <summary>[JavaScript] Node.js integration</summary>

1. Install Nodemailer:

   - Run `npm install nodemailer` in your project directory to install the Nodemailer module, which allows sending emails easily from Node.js applications.

2. Configure Nodemailer to use Postie:

   - Create a transporter object in your Node.js application using Nodemailer, configuring it to use Postie's SMTP server:

     ```javascript
     const nodemailer = require('nodemailer')

     let transporter = nodemailer.createTransport({
       host: 'localhost',
       port: 587,
       secure: false, // true for 465, false for other ports
       auth: {
         user: 'postie', // Postie username
         pass: 'postie', // Postie password
       },
     })
     ```

3. Send an email:

   - Use the transporter to send an email. Here's an example of sending a simple email:

     ```javascript
     let mailOptions = {
       from: '"Example Sender" <sender@example.com>', // sender address
       to: 'recipient@example.com', // list of receivers
       subject: 'Hello ✔', // Subject line
       text: 'Hello world?', // plain text body
       html: '<b>Hello world?</b>', // html body
     }

     transporter.sendMail(mailOptions, (error, info) => {
       if (error) {
         return console.log(error)
       }
       console.log('Message sent: %s', info.messageId)
     })
     ```

4. Test your setup:

   - Run your Node.js application to send a test email. Check your Postie inbox to see the email.

5. Troubleshooting:

   - If you encounter any issues, verify your Postie server is running and listening on port 587.
   - Check the authentication details (username and password) are correctly set to 'postie'.
   - Ensure your Node.js application can connect to `localhost` on port 587. Some environments might require additional network configurations.

</details>

<details>
  <summary>[JavaScript] Next.js integration</summary>

1. Install dependencies:

   - Run `npm install nodemailer` to install Nodemailer, which will be used to send emails from your Next.js application.

2. Create a mail utility file:

   - Create a file named `mail.js` in your `utils` directory (or create it if it doesn't exist) with the following content:

     ```javascript
     import nodemailer from 'nodemailer'

     const transporter = nodemailer.createTransport({
       host: 'localhost',
       port: 587,
       secure: false, // true for 465, false for other ports
       auth: {
         user: 'postie', // your Postie username
         pass: 'postie', // your Postie password
       },
     })

     export const sendEmail = async (to, subject, text, html) => {
       const mailOptions = {
         from: '"Your Name" <your-email@example.com>',
         to,
         subject,
         text,
         html,
       }

       try {
         const info = await transporter.sendMail(mailOptions)
         console.log('Email sent: %s', info.messageId)
         return info
       } catch (error) {
         console.error('Error sending email:', error)
         throw error
       }
     }
     ```

3. Use the mail utility in your API routes:

   - Create an API route in `pages/api/send-email.js` and use the `sendEmail` function from your mail utility to send an email:

     ```javascript
     import { sendEmail } from '../../utils/mail'

     export default async function handler(req, res) {
       if (req.method === 'POST') {
         const { to, subject, text, html } = req.body
         try {
           await sendEmail(to, subject, text, html)
           res.status(200).json({ message: 'Email sent successfully' })
         } catch (error) {
           console.error('Error sending email:', error)
           res.status(500).json({ error: 'Error sending email' })
         }
       } else {
         // Handle any other HTTP method
         res.setHeader('Allow', ['POST'])
         res.status(405).end(`Method ${req.method} Not Allowed`)
       }
     }
     ```

4. Test your email functionality:

   - Use tools like Postman or create a simple form in your Next.js app to make a POST request to `/api/send-email` with the necessary data (`to`, `subject`, `text`, `html`).
   - Check your Postie inbox to see the email.

5. Troubleshooting:

   - Ensure your Postie SMTP server is running and accessible from your Next.js application.
   - Verify the request payload to `/api/send-email` includes all required fields.
   - Check the console for any errors and ensure your environment supports SMTP connections on port 587.

</details>

<details>
  <summary>[PHP] Laravel integration</summary>

1. Modify your .env file:

   ```env
   MAIL_MAILER=smtp
   MAIL_HOST=127.0.0.1
   MAIL_PORT=587
   MAIL_USERNAME=postie
   MAIL_PASSWORD=postie
   MAIL_ENCRYPTION=tls
   MAIL_VERIFY_PEER=false
   MAIL_FROM_ADDRESS="hello@example.com"
   MAIL_FROM_NAME="${APP_NAME}"
   ```

2. In your Laravel application, you can now use the built-in Mail facade to send emails. For example:

   ```php
   use Illuminate\Support\Facades\Mail;
   use App\Mail\TestMail;

   Mail::to('recipient@example.com')->send(new TestMail());
   ```

3. Edit the config/email.php file to include the 'verify_peer' option:

```php
 'mailers' => [

     'smtp' => [
         'transport' => 'smtp',
         'url' => env('MAIL_URL'),
         'host' => env('MAIL_HOST', '127.0.0.1'),
         'port' => env('MAIL_PORT', 2525),
         'encryption' => env('MAIL_ENCRYPTION', 'tls'),
         'username' => env('MAIL_USERNAME'),
         'password' => env('MAIL_PASSWORD'),
         'verify_peer'=> env('MAIL_VERIFY_PEER', true), // new
         'timeout' => null,
     ],

```

4. Create a Mailable class if you haven't already:

   ```bash
   php artisan make:mail TestMail
   ```

5. Edit the TestMail class (located in `app/Mail/TestMail.php`):

   ```php
   <?php

   namespace App\Mail;

   use Illuminate\Bus\Queueable;
   use Illuminate\Mail\Mailable;
   use Illuminate\Queue\SerializesModels;

   class TestMail extends Mailable
   {
       use Queueable, SerializesModels;

       public function build()
       {
           return $this->view('emails.test')
                       ->subject('Test Email');
       }
   }
   ```

6. Create a view for your email (e.g., `resources/views/emails/test.blade.php`):

   ```html
   <!DOCTYPE html>
   <html>
     <body>
       <h1>Test Email</h1>
       <p>This is a test email sent from Laravel using Postie.</p>
     </body>
   </html>
   ```

7. To test, you can create a route or use a controller method:

   ```php
   Route::get('/test-mail', function () {
       Mail::to('test@example.com')->send(new TestMail());
       return 'Test email sent!';
   });
   ```

8. Visit the route in your browser or trigger the email send through your application.

9. Check your Postie inbox to see the test email.
</details>

<details>
  <summary>[PHP] WordPress integration</summary>

1. Install and activate a SMTP plugin:

   - Navigate to your WordPress dashboard, go to Plugins > Add New, and search for a SMTP plugin (e.g., "WP Mail SMTP" by WPForms).
   - Install and activate the chosen plugin.

2. Configure the SMTP plugin:

   - Go to the plugin's settings page (usually under Settings > WP Mail SMTP or similar).
   - Set the following configuration:
     - From Email: Your desired email address.
     - From Name: Your desired name or your site's name.
     - Mailer: Choose 'Other SMTP'.
     - SMTP Host: `localhost`.
     - SMTP Port: `587`.
     - Encryption: `TLS`.
     - Authentication: On, with Username `postie` and Password `postie`.

3. Test your configuration:

   - Most SMTP plugins provide a way to send a test email. Use this feature to send a test email to verify that everything is set up correctly.

4. Use the configured SMTP settings for your WordPress emails:

   - With the SMTP plugin configured, all emails sent by WordPress (e.g., password resets, notifications) will now go through the Postie SMTP server.

5. Check your Postie inbox:

   - After sending a test email or performing an action that triggers an email (like resetting a user's password), check your Postie inbox to see the email.

6. Troubleshooting:

   - If emails are not being sent, double-check your plugin settings for any typos or incorrect configurations.
   - Ensure that your WordPress site can connect to localhost on port 587. Some hosting environments may block outbound SMTP connections, requiring you to contact your hosting provider.

</details>

<details>
  <summary>[PHP] PHPMailer email implementation</summary>

1. Install PHPMailer:

   - Use Composer to add PHPMailer to your project:

     ```bash
     composer require phpmailer/phpmailer
     ```

2. Create a PHP script to send an email:

   - Use PHPMailer to configure SMTP settings and send an email. Replace `your-email@example.com` and `recipient@example.com` with actual email addresses:

     ```php
     <?php
     use PHPMailer\PHPMailer\PHPMailer;
     use PHPMailer\PHPMailer\Exception;

     require 'vendor/autoload.php';

     $mail = new PHPMailer(true);

     try {
         //Server settings
         $mail->SMTPDebug = 0;                                       // Enable verbose debug output
         $mail->isSMTP();                                            // Set mailer to use SMTP
         $mail->Host       = 'localhost';                            // Specify main and backup SMTP servers
         $mail->SMTPAuth   = true;                                   // Enable SMTP authentication
         $mail->Username   = 'postie';                               // SMTP username
         $mail->Password   = 'postie';                               // SMTP password
         $mail->SMTPSecure = 'tls';                                  // Enable TLS encryption, `ssl` also accepted
         $mail->Port       = 587;                                    // TCP port to connect to

         //Recipients
         $mail->setFrom('your-email@example.com', 'Mailer');
         $mail->addAddress('recipient@example.com', 'Joe User');     // Add a recipient

         // Content
         $mail->isHTML(true);                                        // Set email format to HTML
         $mail->Subject = 'Here is the subject';
         $mail->Body    = 'This is the HTML message body <b>in bold!</b>';
         $mail->AltBody = 'This is the body in plain text for non-HTML mail clients';

         $mail->send();
         echo 'Message has been sent';
     } catch (Exception $e) {
         echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
     }
     ```

3. Run your PHP script:

   - Execute the script using a PHP server or command line to send the email.

4. Test your email functionality:

   - Check your Postie inbox to see the email sent by the PHP script.

5. Troubleshooting:

   - Ensure your Postie SMTP server is running and accessible.
   - Verify the SMTP settings, especially the server address, port, and authentication details.
   - Check for any errors output by the script to diagnose issues.

</details>

<details>
  <summary>[PHP] Zend Framework 2 integration</summary>

1. Modify your `config/autoload/local.php` file to include the SMTP settings:

   ```php
   return [
       'mail' => [
           'transport' => [
               'options' => [
                   'name' => 'localhost',
                   'host' => 'localhost',
                   'port' => 587,
                   'connection_class'  => 'plain',
                   'connection_config' => [
                       'username' => 'postie',
                       'password' => 'postie',
                       'ssl'      => 'tls',
                   ],
               ],
           ],
       ],
   ];
   ```

2. Create a mail service factory in `module/Application/src/Service/MailServiceFactory.php`:

   ```php
   <?php

   namespace Application\Service;

   use Zend\Mail\Transport\Smtp;
   use Zend\Mail\Transport\SmtpOptions;
   use Zend\ServiceManager\FactoryInterface;
   use Zend\ServiceManager\ServiceLocatorInterface;

   class MailServiceFactory implements FactoryInterface
   {
       public function createService(ServiceLocatorInterface $serviceLocator)
       {
           $config = $serviceLocator->get('Config');
           $mailConfig = $config['mail']['transport']['options'];

           $transport = new Smtp();
           $options   = new SmtpOptions($mailConfig);
           $transport->setOptions($options);

           return $transport;
       }
   }
   ```

3. Register your factory in `module/Application/config/module.config.php`:

   ```php
   'service_manager' => [
       'factories' => [
           'MailTransport' => 'Application\Service\MailServiceFactory',
       ],
   ],
   ```

4. To send an email, you can now use the `MailTransport` service. For example, in a controller:

   ```php
   <?php

   namespace Application\Controller;

   use Zend\Mail\Message;
   use Zend\Mvc\Controller\AbstractActionController;

   class IndexController extends AbstractActionController
   {
       public function sendEmailAction()
       {
           $transport = $this->getServiceLocator()->get('MailTransport');

           $message = new Message();
           $message->addFrom('hello@example.com')
                   ->addTo('recipient@example.com')
                   ->setSubject('Test Email')
                   ->setBody('This is a test email sent from Zend Framework 2 using Postie.');

           $transport->send($message);

           return $this->response->setContent('Test email sent!');
       }
   }
   ```

5. To test, create a route that points to the `sendEmailAction` method in your controller.

6. Visit the route in your browser or trigger the email send through your application.

7. Check your Postie inbox to see the test email.
</details>

<details>
  <summary>[Python] Django integration</summary>

1. Update your Django settings:

   - Open your Django project's `settings.py` file.
   - Configure the email backend and Postie SMTP server details as follows:

     ```python
     EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
     EMAIL_HOST = 'localhost'
     EMAIL_PORT = 587
     EMAIL_HOST_USER = 'postie'
     EMAIL_HOST_PASSWORD = 'postie'
     EMAIL_USE_TLS = True
     DEFAULT_FROM_EMAIL = 'Your Name <your-email@example.com>'
     ```

2. Send a test email:

   - In one of your Django views or via the Django shell, use the `send_mail` function to send a test email:

     ```python
     from django.core.mail import send_mail

     send_mail(
       'Test Email',
       'This is a test email sent from Django using Postie.',
       'your-email@example.com',
       ['recipient@example.com'],
       fail_silently=False,
     )
     ```

3. Check your Postie inbox:

   - After sending the test email, check your Postie inbox to see the email.

4. Troubleshooting:

   - If the email does not send, ensure your Postie SMTP server is running and accessible.
   - Verify the EMAIL_HOST_USER and EMAIL_HOST_PASSWORD settings are correct.
   - Check your Django console or logs for any error messages that can help diagnose the issue.

</details>

<details>
  <summary>[Python] smtplib.SMTP integration</summary>

1. Import smtplib and create SMTP object:

   - Start by importing the `smtplib` module and create an `SMTP` object that represents a connection to the Postie SMTP server:

     ```python
     import smtplib

     smtpObj = smtplib.SMTP('localhost', 587)
     ```

2. Start TLS for security:

   - Call the `starttls()` method to put the SMTP connection in TLS (Transport Layer Security) mode. All SMTP commands that follow will be encrypted:

     ```python
     smtpObj.starttls()
     ```

3. Login to the server:

   - Log in to the Postie server using the `login` method with the username and password 'postie':

     ```python
     smtpObj.login('postie', 'postie')
     ```

4. Send an email:

   - Use the `sendmail` method to send an email. You need to specify the sender's email address, the recipient's email address, and the message to send:

     ```python
     from_email = 'your-email@example.com'
     to_email = 'recipient@example.com'
     subject = 'Hello'
     body = 'This is a test email sent using smtplib in Python.'
     message = f'Subject: {subject}\n\n{body}'

     smtpObj.sendmail(from_email, to_email, message)
     ```

5. Close the SMTP connection:

   - Once the email is sent, close the connection using the `quit` method:

     ```python
     smtpObj.quit()
     ```

6. Check your Postie inbox:

   - After sending the email, check your Postie inbox to see the email.

7. Troubleshooting:

   - If you encounter any issues, ensure the Postie SMTP server is running and accessible on `localhost` port `587`.
   - Verify the login credentials are correct.
   - Check for any typos in the email addresses or the message body.

</details>

<details>
  <summary>[Python] Flask email implementation</summary>

1. Install Flask-Mail:

   - Run `pip install Flask-Mail` to install the Flask-Mail extension, which simplifies sending emails from your Flask application.

2. Configure Flask-Mail in your Flask app:

   - In your Flask application's configuration, add the following settings to configure Flask-Mail to use Postie's SMTP server:

     ```python
     from flask import Flask
     from flask_mail import Mail, Message

     app = Flask(__name__)
     app.config['MAIL_SERVER'] = 'localhost'
     app.config['MAIL_PORT'] = 587
     app.config['MAIL_USE_TLS'] = True
     app.config['MAIL_USERNAME'] = 'postie'
     app.config['MAIL_PASSWORD'] = 'postie'
     app.config['MAIL_DEFAULT_SENDER'] = 'your-email@example.com'

     mail = Mail(app)
     ```

3. Send an email:

   - Create a route in your Flask application that sends an email using the `Message` class and `mail.send()` method:

     ```python
     @app.route('/send-email')
     def send_email():
         msg = Message('Hello from Flask',
                       recipients=['recipient@example.com'])
         msg.body = 'This is a test email sent from a Flask application using Postie.'
         mail.send(msg)
         return 'Email sent!'
     ```

4. Run your Flask application:

   - Make sure your Flask application is running. You can start it by executing `flask run` in your terminal.

5. Test the email functionality:

   - Access the `/send-email` route from your browser or using a tool like `curl` to trigger the email sending process.

6. Check your Postie inbox:

   - After triggering the email send, check your Postie inbox to see the email.

7. Troubleshooting:

   - If the email does not send, ensure your Postie SMTP server is running and accessible.
   - Verify the Flask-Mail configuration settings are correct.
   - Check your Flask application logs for any error messages that can help diagnose the issue.

</details>

<details>
  <summary>[Rust] Rocket.rs email implementation</summary>

1. Add dependencies:

   - Add `lettre`, `lettre_email`, and `tokio` to your `Cargo.toml` file for sending emails and async support:

     ```toml
     [dependencies]
     rocket = "0.5"
     lettre = "0.10"
     lettre_email = "0.9"
     tokio = { version = "1", features = ["full"] }
     ```

2. Configure SMTP transport:

   - In your main Rust file, configure the SMTP transport using `lettre` to use Postie's SMTP server:

     ```rust
     use lettre::{SmtpTransport, Transport};
     use lettre_email::EmailBuilder;
     use tokio;

     #[tokio::main]
     async fn main() {
         rocket::build().launch().await;
     }

     #[get("/send-email")]
     async fn send_email() -> &'static str {
         let email = EmailBuilder::new()
             .to("recipient@example.com")
             .from("your-email@example.com")
             .subject("Hello from Rocket")
             .text("This is a test email sent from a Rocket.rs application using Postie.")
             .build()
             .unwrap();

         let mailer = SmtpTransport::builder_dangerous("localhost")
             .port(587)
             .credentials(("postie", "postie").into())
             .build();

         match mailer.send(email.into()) {
             Ok(_) => "Email sent successfully!",
             Err(e) => {
                 eprintln!("Failed to send email: {:?}", e);
                 "Failed to send email"
             },
         }
     }
     ```

3. Register the route:

   - Make sure to register the `send_email` route with your Rocket application:

     ```rust
     #[launch]
     fn rocket() -> _ {
         rocket::build().mount("/", routes![send_email])
     }
     ```

4. Run your Rocket application:

   - Use `cargo run` to start your Rocket application.

5. Test the email functionality:

   - Access the `/send-email` endpoint from your browser or using a tool like `curl` to trigger the email sending process.

6. Check your Postie inbox:

   - After triggering the email send, check your Postie inbox to see the email.

7. Troubleshooting:

   - If the email does not send, ensure your Postie SMTP server is running and accessible.
   - Verify the SMTP transport configuration settings are correct.
   - Check the Rust console for any error messages that can help diagnose the issue.

</details>

<details>
  <summary>[Ruby] Rails ActionMailer implementation</summary>

1. Configure ActionMailer:

   - Open your Rails application's `config/environments/development.rb` (or the appropriate environment file) and configure ActionMailer to use Postie's SMTP server:

     ```ruby
     # config/environments/development.rb
     config.action_mailer.delivery_method = :smtp
     config.action_mailer.smtp_settings = {
       address: 'localhost',
       port: 587,
       user_name: 'postie',
       password: 'postie',
       authentication: 'plain',
       enable_starttls_auto: true
     }
     ```

2. Generate a mailer:

   - Use the Rails generator to create a new mailer. For example, to create a `UserMailer`, run:

     ```bash
     rails generate mailer UserMailer
     ```

3. Define a mailer action:

   - In the generated `UserMailer`, define an action to send an email. For example, to send a welcome email:

     ```ruby
     # app/mailers/user_mailer.rb
     class UserMailer < ApplicationMailer
       def welcome_email(user)
         @user = user
         mail(to: @user.email, subject: 'Welcome to My Awesome Site')
       end
     end
     ```

4. Send an email:

   - To send an email, call the mailer action from anywhere in your Rails application. For example, after a user signs up:

     ```ruby
     # Assuming `@user` is an instance of your User model
     UserMailer.welcome_email(@user).deliver_now
     ```

5. Test your email functionality:

   - Trigger the action that sends the email in your application and check your Postie inbox to see the email.

6. Troubleshooting:

   - Ensure your Postie SMTP server is running and accessible.
   - Verify the ActionMailer configuration in your Rails environment file.
   - Check your Rails logs for any error messages that can help diagnose the issue.

</details>

<details>
  <summary>[C#] MailKit email implementation</summary>

1. Install MailKit:

   - Add MailKit to your project using NuGet Package Manager or the .NET CLI:

     ```bash
     dotnet add package MailKit
     ```

2. Configure SMTP client:

   - Create a method to send an email using MailKit's `SmtpClient`. Configure it to use Postie's SMTP server:

     ```csharp
     using MailKit.Net.Smtp;
     using MimeKit;

     public static async Task SendEmailAsync(string recipientEmail, string subject, string body)
     {
         var emailMessage = new MimeMessage();
         emailMessage.From.Add(new MailboxAddress("Your Name", "your-email@example.com"));
         emailMessage.To.Add(new MailboxAddress("", recipientEmail));
         emailMessage.Subject = subject;
         emailMessage.Body = new TextPart("plain") { Text = body };

         using (var client = new SmtpClient())
         {
             await client.ConnectAsync("localhost", 587, false);
             await client.AuthenticateAsync("postie", "postie");
             await client.SendAsync(emailMessage);
             await client.DisconnectAsync(true);
         }
     }
     ```

3. Send an email:

   - Call the `SendEmailAsync` method from anywhere in your application to send an email. For example:

     ```csharp
     await SendEmailAsync("recipient@example.com", "Hello from C#", "This is a test email sent from a C# application using MailKit and Postie.");
     ```

4. Test your email functionality:

   - Execute the method to send an email and check your Postie inbox to see the email.

5. Troubleshooting:

   - Ensure your Postie SMTP server is running and accessible.
   - Verify the SMTP client configuration, especially the server address, port, and authentication details.
   - Check for any exceptions thrown by the `SendEmailAsync` method to diagnose issues.

</details>
