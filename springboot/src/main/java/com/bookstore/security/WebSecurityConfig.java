package com.bookstore.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class WebSecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Bean
    public UserDetailsService userDetailsService() {
        return new CustomUserDetailsService();
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        http.authorizeHttpRequests(authz -> authz
                .requestMatchers("/admin/**", "/api/admin/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers("/checkout", "/order", "/payment/**", "/order/**", "/profile/**", "/orders/**", "/notifications/**", "/api/user/**").authenticated()
                .requestMatchers("/cart/**", "/api/**", "/forgot-password", "/reset-password", "/login", "/register", "/").permitAll()
                .anyRequest().permitAll())
                .formLogin(form -> form
                        .loginPage("/login")
                        .usernameParameter("username")
                        .passwordParameter("password")
                        .successHandler((request, response, authentication) -> {
                            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
                            request.getSession().setAttribute("user", userDetails.getUser());
                            
                            String jwt = tokenProvider.generateToken(authentication);
                            jakarta.servlet.http.Cookie jwtCookie = new jakarta.servlet.http.Cookie("jwt", jwt);
                            jwtCookie.setHttpOnly(true);
                            jwtCookie.setPath("/");
                            jwtCookie.setMaxAge(24 * 60 * 60);
                            response.addCookie(jwtCookie);

                            boolean isAdmin = authentication.getAuthorities().stream()
                                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                            
                            if (isAdmin) {
                                response.sendRedirect("/admin");
                            } else {
                                String returnUrl = request.getParameter("returnUrl");
                                response.sendRedirect(returnUrl != null && !returnUrl.isEmpty() ? returnUrl : "/");
                            }
                        })
                        .failureUrl("/login?loginError=true")
                        .permitAll())
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .addLogoutHandler((request, response, authentication) -> {
                            if (request.getSession(false) != null) {
                                request.getSession().removeAttribute("user");
                            }
                        })
                        .logoutSuccessUrl("/")
                        .invalidateHttpSession(false) // Giữ lại session để không mất giỏ hàng
                        .deleteCookies("jwt")
                        .permitAll())
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(e -> e.accessDeniedPage("/403"));

        return http.build();
    }
}
