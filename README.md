![Postie Logo](https://raw.githubusercontent.com/reconka/Postie/d121331ffe33eede921187f198f694ca0bf81b02/src/media/postie-banner.svg)

# Postie: Development Email SMTP Server for VS Code

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![VS Code Version](https://img.shields.io/badge/VS%20Code-%5E1.75.0-blue.svg?style=flat-square)](https://code.visualstudio.com/updates/v1_75)
[![TypeScript Version](https://img.shields.io/badge/TypeScript-%5E4.8.4-blue.svg?style=flat-square)](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-8.html)
[![jest](https://img.shields.io/badge/tested_with-jest-%23994499.svg?style=flat-square)](https://jestjs.io/)
[![ESLint](https://img.shields.io/badge/linted_with-eslint-%234B32C3.svg?style=flat-square)](https://eslint.org/)
[![Version](https://img.shields.io/badge/version-0.0.1-orange.svg?style=flat-square)](https://github.com/Zoltan.Birner/postie)
[![CI](https://github.com/reconka/Postie/actions/workflows/ci.yml/badge.svg)](https://github.com/reconka/Postie/actions/workflows/ci.yml)

Postie is a Visual Studio Code extension that provides a development email SMTP server using Nodemailer smtp-server. It allows developers to catch and inspect emails sent by their applications during development, all within the VS Code environment.

**Note:** This extension is designed for development purposes only. Do not use it in production environments.

## Features

- Integrated SMTP server using Nodemailer smtp-server
- Export emails as .eml files
- Open email source in your editor
- HTML content preview with responsive design modes (Mobile/Tablet/Desktop)

## Installation

1. Open VS Code
2. Go to the Extensions view (`Ctrl+Shift+X`)
3. Search for "Postie"
4. Click **Install**

Alternatively, run the following command in VS Code's quick open (`Ctrl+P`):

`ext install reconka.vscode-postie`

## Usage

1. Start the Postie SMTP server by clicking the Postie icon in the Activity Bar.
2. Configure your application to send emails to `localhost` on the port specified in the Postie config.
3. View incoming emails in the Postie section located in the sidebar

![Postie Welcome screen](https://github.com/reconka/Postie/blob/main/src/media/email-details-preview.gif?raw=true)

Postie will store emails in your vscode until you delete them. You can export emails as .eml files or open the email source in your editor.

When previewing email content, links can be opened in your default web browser by clicking on them with `Cmd` (on macOS) or `Ctrl` (on Windows).

For more information, see the [Postie Integration Guide](https://github.com/reconka/Postie/blob/main/src/media/integration.md).

## Configuration

To customize Postie for your development environment, you can adjust the following settings in your VS Code settings.json file:

- `postie.smtpServerPort`: The port number for the SMTP server. Default is `587`.
- `postie.smtpUsername`: Username for SMTP server authentication. Default is `"postie"`.
- `postie.smtpPassword`: Password for SMTP server authentication. Default is `"postie"`.
- `postie.maxStoredEmailsCount`: The maximum number of emails Postie will store before older emails are deleted. Default is `100`.
- `postie.maxEmailSize`: Maximum size of an email in bytes. The default is `1048576` (1MB).
- `postie.showNewEmailNotification`: Set to `true` to show a notification when a new email arrives. Default is `true`.
- `postie.runServerOnStartup`: Set to `true` to automatically start the SMTP server when VS Code starts. Default is `true`.
- `postie.allowExternalMails`: Set to `true` to allow receiving emails from external sources. This is useful for testing emails sent from external sources. Default is `false`.

You can modify these settings to fit your needs. For example, to change the SMTP server port and the maximum email size, add the following lines to your `settings.json`:

```json
{
  "postie.smtpServerPort": 587,
  "postie.maxEmailSize": 2097152
}
```

## Contributing

We welcome contributions to Postie! Please check out our contributing guidelines for more information on how to get started.

## Development Setup

To set up a development environment for contributing to the Postie extension, follow these steps:

1. **Clone the Repository**

   First, clone the repository to your local machine using Git:

2. **Install Dependencies**

   Navigate to the cloned directory and install the necessary dependencies using npm:

   ```bash
   npm install
   ```

3. **Open in VS Code**

   Open the cloned Postie directory in Visual Studio Code:

   ```bash
   code .
   ```

4. **Run the Extension in Development Mode**

   In VS Code, press `F5` to open a new VS Code window with the Postie extension running in development mode. This allows you to test your changes in a real-world scenario.

5. **Making Changes**

   Make your desired changes to the code. You can debug the extension by setting breakpoints in the VS Code editor.

6. **Submit a Pull Request**

   Once you're satisfied with your changes, commit your changes, push them to your fork, and submit a pull request to the main Postie repository.

## License

This project is licensed under the MIT License.
