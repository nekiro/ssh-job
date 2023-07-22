[![test-build](https://github.com/nekiro/ssh-job/actions/workflows/test-build.yml/badge.svg)](https://github.com/nekiro/ssh-job/actions/workflows/test-build.yml)

# ssh-job

Easier automated deployment through ssh via Github Action. 🚀

Execute commands on target server with few easy steps :)

## Options

| Param               | default | required | description                                                                                                  |
| :------------------ | :-----: | -------: | ------------------------------------------------------------------------------------------------------------ |
| host                |   n/a   |     true | Host to connect to                                                                                           |
| port                |   22    |    false | Port to connect to                                                                                           |
| key                 |   n/a   |     true | Private key used for authorization                                                                           |
| user                |   n/a   |     true | User used for authorization                                                                                  |
| password            |   n/a   |    false | Password used for authorization                                                                              |
| envs                |   n/a   |    false | Json serialized secrets exported to shell                                                                    |
| ignoredEnvs         |   n/a   |    false | List of comma separated envs to ignore when exporting to shell                                               |
| command             |   n/a   |     true | Command/s or script to execute                                                                               |
| exportActionOptions |  false  |     true | Export action options, this is handy when you want to access HOST, USER or any other options in shell script |

## Examples

Authorize with ssh private key and execute some commands

```yml
- name: create-directory
  uses: nekiro/ssh-job@main
  with:
    host: ${{ secrets.HOST }}
    key: ${{ secrets.KEY }}
    user: ${{ secrets.USER }}
    command: |
      ls
      mkdir dir
```

It's possible to automatically pass github secrets to the shell script, it allows you to use provided secrets directly in the bash script.

In this example, we have few secrets for example `DIRECTORY`, we want to pass all of them to shell script, so we simply add `envs: ${{ toJson(secrets) }}` and use it as regular bash variable

Keep in mind action options are not exported by default, so you wont be able to access HOST, KEY etc.

```yml
- name: create-directory
  uses: nekiro/ssh-job@main
  with:
    host: ${{ secrets.HOST }}
    key: ${{ secrets.KEY }}
    user: ${{ secrets.USER }}
    envs: ${{ toJson(secrets) }}
    command: mkdir $DIRECTORY
```

## Contribution
Want to improve this project or found a bug? Feel free to open pull requests and create issues.

If you are not technical or simply don't have time, there is always a way to give back by clicking on the sponsor tab and sending some $, everything is appreciated :D
