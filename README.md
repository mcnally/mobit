

<img src="mobit-alt.png" alt="mobit" width="150" align="right" />

<br/><br/><br/>


# Mobit

## What is it 
An cross platform cli tool build in node to help the git handover when mobbing remotely.

The app listens for changes in config that will determine who is driving or navigating, and the terminal will update when changes are detected.

**Note that this is an early release may have bugs. Please create an issue for any problems you encounter**


## Installation
`npm install -g mobit`

`yarn global add mobit`

Alternatively clone the repo and `yarn link`

## Commands

`mobit` Runs the main menu

*Note that you can also do the following commands by using the menu

`mobit start [minutes]` Starts the app (with optional minutes to override the config). User will start as either navigator or driver depending on the config.

`mobit shuffle` Shuffle the mob and update the config.

`mobit setbranch [branchname]` Sets the mobbing branch (stored locally).

`mobit config` Prompts to update the main config (mob members, duration, current driver etc.).

`mobit next [user]` Hands over to the next user (pass a git username to pass directly to that user)

`mobit finish` Finish the mob session

## Still to do 
- Implement break functionality
- Fix all @todo's
- Add custom base branch and commit message to config
- Refactor and fix test coverage 
- More testing on all scenarios
- Add zoom integration
- Add auto publishing with semantic versioning

## How it works
When you run the tool it will ask for information about the mob session (if not already provided). When you start mobbing you will be either in a driver or navigator mode. Note that you will need to keep the cli running to receive updates.

### Driving
Timer begins, once the timer is up you have the following options
- Handover: Pass to the next person, all work is committed and pushed to the wip branch (with --no-verify).
- Finish: Complete the mob, squash wip commits and stage changes on the main branch
- Break: todo all mob members will be have a countdown until the break ends
- Exit: Do nothing and exit to main menu

### Navigating
App listens for changes in the config, if its your turn your timer will start.

### Configuration 
Local config (mob branch/base branch/commit message) are stored on your machine and added via the cli menu. 

Mob config is temporarily stored in the repo as a json file while mobbing. Ths contains info about the mob:
- Members of the mob
- Duration 
- Break duration
- Number of rotations before a break

## Alternatives 
- https://github.com/remotemobprogramming/mob - Great tool that heavily inspired this one

