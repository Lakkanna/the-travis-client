# The Travis Client

[![](https://vsmarketplacebadge.apphb.com/version-short/Lakkannawalikar.the-travis-client.svg)](https://marketplace.visualstudio.com/items?itemName=lakkanna.the-travis-client)
[![](https://vsmarketplacebadge.apphb.com/downloads-short/Lakkannawalikar.the-travis-client.svg)](https://marketplace.visualstudio.com/items?itemName=Lakkannawalikar.the-travis-client)
[![](https://vsmarketplacebadge.apphb.com/rating-short/Lakkannawalikar.the-travis-client.svg)](https://marketplace.visualstudio.com/items?itemName=Lakkannawalikar.the-travis-client)
![build](https://travis-ci.org/Lakkanna/the-travis-client.svg?branch=master)

Extension to interact with travis build status.

### If you like 👍 give stars ⭐️ in [Github](https://github.com/Lakkanna/the-travis-client) and [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Lakkannawalikar.the-travis-client&ssr=false#review-details).

## Features

Lists last 10 builds for each branch for all repositories you own or organization, the build status is shown using icon.

![demo](images/demo2.png)   ![demo](images/demo3.png)

## Requirements

- Account should be there in travis-ci account and `api-token`.
  * [Travis-CI api-token](https://travis-ci.org/account/preferences) -> settings --> COPY TOKEN
- Repositories should be active for builds in travis-ci.
- Owner or Orgonization name for the repositories.

## Extension Settings

Extension requires three settings
* **owner/organization name** _(mandatory)_
* **api-token** _(mandatory)_: this you will find in travis account settings,
* **branches** _(optional)_ if you not added branches it show status for all branches.

Copy **api-token**, you need it once after installing extension, you'll see pop-up paste there.

**_Note_**: By miss if you missed pasting api-token, you can add it again by clicking on **_Gear_** icon which shows on REPOSITORIES title or you can run using command pallette `Shift + CMD + P` -> search for `Travis Client: Set token` and hit enter.

This extension contributes the following settings:

* `travisClient.owner`: owner name or organization name
* `travisClient.branches`: want's to see only these branches build status

For example:

* `"travisClient.owner": "lakkanna"`,
* `"travisClient.branches": ["master", "sprint"]`

## Release Notes

### 1.0.0

- Get all repositories from https://travis-ci.org
- Get branches for all repositories
- Get build status for all branches


-----------------------------------------------------------------------------------------------------------


![feature 1](images/demo1.png)

