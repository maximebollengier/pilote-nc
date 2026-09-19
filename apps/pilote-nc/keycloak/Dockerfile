# Keycloak "optimisé" pour pilote-nc : build fait une fois à la construction de
# l'image (démarrage rapide), realm importé au premier démarrage.
FROM quay.io/keycloak/keycloak:26.0 AS builder
ENV KC_DB=postgres \
  KC_HEALTH_ENABLED=true
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:26.0
COPY --from=builder /opt/keycloak/ /opt/keycloak/
COPY realm-pilote.json /opt/keycloak/data/import/realm-pilote.json
ENV KC_DB=postgres \
  KC_HTTP_ENABLED=true \
  KC_PROXY_HEADERS=xforwarded
EXPOSE 8080
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized", "--import-realm"]
