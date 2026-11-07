# ep_webhooks
Webhooks for Etherpad Lite.

# WORK IN PROGRESS

While it's somewhat useful, work is in progress. See the **TODO** below. Any ideas and contributions are welcome, see the **TODO** section first.

# Configuration

In your Etherpad Lite ``settings.json``:

```
  "ep_webhooks": {
    "apiKey": "superSecretAPIkeySentInXApiKeyHeader",
    "caCert": "-----BEGIN CERTIFICATE-----\nMIIDoDCCAogCCQC85R3CVrF5aDANBgkqhkiG9w0BAQsFADCBkTELMAkGA1UEBhMC\nRUUxETAPBgNVBAgMCEhhcmp1bWFhMRAwDgYDVQQHDAdUYWxsaW5uMRIwEAYDVQQK\nDAlDaXRpemVuT1MxCzAJBgNVBAsMAklUMRQwEgYDVQQDDAtkZXYudG9ydS5lZTEm\nMCQGCSqGSIb3DQEJARYXY2l0aXplbm9zLmVzdEBnbWFpbC5jb20wHhcNMTUxMDAx\nMDkyMzE1WhcNNDMwMjE1MDkyMzE1WjCBkTELMAkGA1UEBhMCRUUxETAPBgNVBAgM\nCEhhcmp1bWFhMRAwDgYDVQQHDAdUYWxsaW5uMRIwEAYDVQQKDAlDaXRpemVuT1Mx\nCzAJBgNVBAsMAklUMRQwEgYDVQQDDAtkZXYudG9ydS5lZTEmMCQGCSqGSIb3DQEJ\nARYXY2l0aXplbm9zLmVzdEBnbWFpbC5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IB\nDwAwggEKAoIBAQDYt0FCtIgu0NcKQ+6T+tUNtTChg8g/1xgR0KS4B9zqdoxHuE/8\nHvylHff/1ysmFEiaFX6aoo3ww1PSY7tJ38+ozkks8Ga3wWADVuCVWytu1gpznuDO\neLq/TJ7MMKuev1SFumpTjPuN3ppD25yyb30Ajx29e9xXO0oa6s5TFD1nzZiZRyHs\n36BPsD3Dk7P3q6OKuuP/AEJZC8vvAPDJXh1X9o1+vhQ7mOzISE6CoKc1FheOLMAQ\nKqkLlMPDJgSSNzAUhB+BbNanhynkRDfhQnIDUpJjjNx8vzHKLoPtfA+RSYgA6DOD\n8jDgTPaszKNQG2VYauLd4Tg/tQx+GdlbtIhpAgMBAAEwDQYJKoZIhvcNAQELBQAD\nggEBAD2OFnsFll4TqhlWD2zNbVz5nUIqPIQZKi6uSmLLZdsn61dVuIMqfd1awdxL\ntyLu8IxmFqjGJuKwTm1IzDlkjG7JXB9TXGjj994wkBfJeEK01iUrS24GU2kWU0DU\nFe7GHHNi+x0nSEf2tfwQJw+9+WkR5jfq7eyUPKqlm8aETLT0Hk20KF/Tew9q/LAw\n8tQ1BpjmB5uMw7YPhu41Ef/Fcd3myVGBBgVSAjJHgc6Tq29FsOqh7Fi7zFHr/u5k\nP0A4iFQAld2k1Jwq+18/Qq8k8Jnpyh7DhefLNMc0HVg3H+3sCSHSDv0fEAa+7mRm\nR3jc3Y4rDxpM56PM9r3c19aKOYc=\n-----END CERTIFICATE-----"
    "pads": {
        "update": ["https://mydomain.com/api/internal/notifications/pads/update"]
    }
  }
```

* Where the ``pads.update`` configures webhook for ``pads.update`` event. See the "Supported hooks" section.
* You can specify multiple urls, each of them will be called on the event.
* The hook endpoint can authorize the call by verifying the secret in the ``X-API-KEY`` header
* The ``caCert`` is optional, it enables you to provide a CA certificate in case you call a service which has a certificate that is not in the Node.JS trusted list by default, like self-signed certificates.

# Supported hooks

## pads.update

Hook is called when any of the pads is updated. Payload contains the id-s of the pads that have been modified and user id-s of authors and last revision number of that user.
 
Sample HTTP request made by ep_webhooks to the registered hook url:

```
POST https://mydomain.com/api/notifications/pads/update
X-API-KEY: supersecretApiKeyForTheMasses
{
    pads: {"pad1":[{"userId": "2e904907-a763-461b-8327-75a0d3fc6d93", rev:3}, {"userId": "2e80db42-8146-48dc-bbfd-a192684c2513", rev: 3}], "pad2":[{"userId":"c9d946f7-1e50-4f93-b205-daa00f2937d2", rev:2}], "pad3":[{"userId": "2e80db42-8146-48dc-bbfd-a192684c2513", rev: 4}]}
}
```

# TODO

* Create API to register and de-register hooks instead of EP ``settings.json`` configuration.
    * Register must accept all parameters for the ``lodash.debounce`` ([https://lodash.com/docs#debounce]()). Right now the configuration is hardcoded. See ``serverHooks.js``.
    * API should do a pingback on registering to verify that the API is available.
    * Some kind of mechanism of verifying payloads. May want to borrow good ideas from GitHub [https://developer.github.com/webhooks/]() & [https://developer.github.com/v3/repos/hooks/#pubsubhubbub]().
* Back-off mechanism on errors - if a hook call fails too much, just stop sending or retry, but increase retry delay with each failure.
* Define method for telling ``ep_webhooks`` to temporarily delay calling registered hook.
    * Maybe overkill? You can register/de-register if you want to. 
    * For example response headers or HTTP response code. Useful when your system is under heavy load and you want to temporarily delay messages for a longer period of time.
  