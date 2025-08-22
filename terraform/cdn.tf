# Cloud CDN configuration for NubemSecurity

resource "google_compute_backend_service" "nubemsecurity_backend" {
  name                  = "nubemsecurity-backend"
  protocol              = "HTTP"
  timeout_sec           = 30
  enable_cdn            = true
  
  cdn_policy {
    cache_mode = "CACHE_ALL_STATIC"
    default_ttl = 3600
    max_ttl = 86400
    client_ttl = 3600
    
    cache_key_policy {
      include_host = true
      include_protocol = true
      include_query_string = true
      
      query_string_whitelist = ["version", "provider", "format"]
    }
    
    negative_caching = true
    negative_caching_policy {
      code = 404
      ttl = 300
    }
    negative_caching_policy {
      code = 410
      ttl = 900
    }
  }
  
  backend {
    group = google_compute_instance_group.nubemsecurity_group.self_link
  }
  
  health_checks = [google_compute_health_check.nubemsecurity_health.id]
}

resource "google_compute_url_map" "nubemsecurity_urlmap" {
  name            = "nubemsecurity-urlmap"
  default_service = google_compute_backend_service.nubemsecurity_backend.id
  
  host_rule {
    hosts        = ["api.nubemsecurity.com"]
    path_matcher = "api"
  }
  
  path_matcher {
    name            = "api"
    default_service = google_compute_backend_service.nubemsecurity_backend.id
    
    path_rule {
      paths   = ["/static/*", "/assets/*", "/images/*"]
      service = google_compute_backend_service.nubemsecurity_backend.id
      
      route_action {
        cdn_policy {
          cache_mode = "FORCE_CACHE_ALL"
          default_ttl = 86400
        }
      }
    }
  }
}

resource "google_compute_global_address" "nubemsecurity_ip" {
  name = "nubemsecurity-global-ip"
}

resource "google_compute_global_forwarding_rule" "nubemsecurity_forward" {
  name       = "nubemsecurity-forwarding-rule"
  target     = google_compute_target_https_proxy.nubemsecurity_proxy.id
  port_range = "443"
  ip_address = google_compute_global_address.nubemsecurity_ip.address
}
