# Runbook - agent01 SSH Access

**Host:** `agent01`
**IP LAN actual:** `192.168.100.93`
**Usuario:** `erwin`
**Fecha de configuracion:** 2026-09-25
**Estado:** acceso por llave verificado desde `dev01`

---

## Objetivo

Permitir administracion segura de `agent01` desde `dev01` sin depender de la password provisoria para cada conexion.

`dev01` sigue siendo la workstation/control plane. `agent01` se trata como servidor.

---

## Estado Verificado

Se creo una llave SSH dedicada fuera del repositorio:

```text
~/.ssh/agent01_ed25519
~/.ssh/agent01_ed25519.pub
```

Fingerprint observado:

```text
SHA256:OtMHXeEoJHQaF6XyTXSiPLJRkT9sB+5Zl/nlznRmvF0 dev01-to-agent01
```

La llave publica fue instalada en:

```text
agent01:/home/erwin/.ssh/authorized_keys
```

El alias local `agent01` fue agregado a:

```text
~/.ssh/config
```

Entrada esperada:

```sshconfig
Host agent01
    HostName 192.168.100.93
    User erwin
    Port 22
    IdentityFile ~/.ssh/agent01_ed25519
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 5
```

---

## Conexion

Desde `dev01`:

```bash
ssh agent01
```

Comando de verificacion no destructivo:

```bash
ssh -o BatchMode=yes agent01 'hostname; whoami; pwd'
```

Resultado verificado:

```text
agent01
erwin
/home/erwin
```

---

## Comandos De Inspeccion Segura

```bash
ssh agent01 'hostname; whoami; pwd; uptime; free -h; df -h; ip -br addr'
```

No requiere `sudo` y no modifica el servidor.

---

## Reglas De Seguridad

- Nunca guardar `~/.ssh/agent01_ed25519` en Git.
- Nunca pegar la llave privada en chats, tickets ni docs.
- Mantener permisos:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/agent01_ed25519
chmod 644 ~/.ssh/agent01_ed25519.pub
```

- No deshabilitar password auth hasta tener:
  - acceso por llave probado;
  - al menos una segunda sesion SSH abierta o acceso fisico confirmado;
  - procedimiento de rollback documentado.

---

## Endurecimiento Pendiente

Cuando el acceso por llave este suficientemente validado:

1. Crear backup de configuracion SSH en `agent01`.
2. Verificar que `ssh agent01` funciona con `BatchMode=yes`.
3. Abrir una segunda sesion SSH antes de cambios.
4. Cambiar `PasswordAuthentication no` en sshd.
5. Reiniciar SSH.
6. Probar nueva conexion por llave.
7. Mantener rollback listo.

Comandos sugeridos para una fase futura, no ejecutar sin aprobacion:

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%Y%m%d%H%M%S)
sudo sshd -t
sudo systemctl restart ssh
```

---

## Rollback Conceptual

Si una configuracion SSH futura falla, usar acceso fisico/local a `agent01` para restaurar el backup de `/etc/ssh/sshd_config` y reiniciar SSH.
