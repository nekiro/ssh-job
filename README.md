[![test-build](https://github.com/nekiro/ssh-job/actions/workflows/test-build.yml/badge.svg)](https://github.com/nekiro/ssh-job/actions/workflows/test-build.yml)

# ssh-job

Easier automated deployment through ssh via Github Action. 🚀

Execute commands on target server with few easy steps :)

Commands are executed by `bash --noprofile --norc -c 'source /dev/stdin'` with `set -euo pipefail`.

## Options

| Param               | default | required | description                                                                                                  |
| :------------------ | :-----: | :------: | ------------------------------------------------------------------------------------------------------------ |
| host                |   n/a   |   true   | Host to connect to                                                                                           |
| port                |   22    |  false   | Port to connect to                                                                                           |
| user                |   n/a   |   true   | User used for authorization                                                                                  |
| key                 |   n/a   |  false   | Private key used for authorization, required when password is not set                                        |
| passphrase          |   n/a   |  false   | Passphrase used to decrypt key                                                                               |
| password            |   n/a   |  false   | Password used for authorization, required when key is not set                                                |
| fingerprint         |   n/a   |  false   | SHA256 fingerprint of the server host key, the connection is rejected when it does not match                 |
| envs                |   n/a   |  false   | Json serialized secrets exported to shell                                                                    |
| ignoredEnvs         |   n/a   |  false   | List of comma separated envs to ignore when exporting to shell                                               |
| command             |   n/a   |   true   | Command/s or script to execute                                                                               |
| exportActionOptions |  false  |  false   | Export action options, this is handy when you want to access HOST, USER or any other options in shell script |
| tty                 |  false  |  false   | Allocate a pseudo-terminal (TTY) for the SSH command                                                         |
| connectTimeout      |   20    |  false   | Seconds to wait for the SSH connection and authentication                                                    |
| timeout             |    0    |  false   | Seconds to wait for the command to finish, 0 disables it. The connection is closed when the time runs out    |

## Host key verification

Without `fingerprint` the action accepts any server, so a man-in-the-middle can read your credentials and secrets. Set it to make the action refuse servers with a different host key.

Get the fingerprint from a machine that already trusts the server:

```sh
ssh-keyscan -t ed25519 example.com | ssh-keygen -lf -
# 256 SHA256:nThbg6kXUpJWGl7E1IGOCspRomTxdCARLviKw6E5SY8 example.com (ED25519)
```

Store the `SHA256:...` part as a secret and pass it to the action:

```yml
- name: deploy
  uses: nekiro/ssh-job@main
  with:
    host: ${{ secrets.HOST }}
    key: ${{ secrets.KEY }}
    user: ${{ secrets.USER }}
    fingerprint: ${{ secrets.HOST_FINGERPRINT }}
    command: ls
```

## Examples

The examples use `@main` for brevity. Pin the action to a release tag or a commit SHA in your workflows, so a change in this repository can not alter your deployment without your review.

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

Names of envs can contain only letters, digits and underscores. Values that are not strings (numbers, booleans) are converted to their json form.

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
