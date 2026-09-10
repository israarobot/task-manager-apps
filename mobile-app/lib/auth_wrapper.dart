import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'engineer_dashboard.dart';
import 'login_screen.dart'; // Assure-toi que ce fichier existe

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  final supabase = Supabase.instance.client;
  bool isLoading = true;
  bool isLoggedIn = false;

  @override
  void initState() {
    super.initState();
    _checkSession();
  }

  Future<void> _checkSession() async {
    final session = supabase.auth.currentSession;
    setState(() {
      isLoggedIn = session != null;
      isLoading = false;
    });
  }

  void _onLoginSuccess() {
    setState(() {
      isLoggedIn = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (isLoggedIn) {
      return const EngineerDashboard();
    } else {
      // Affiche l'écran de connexion
      return LoginScreen(onLoginSuccess: _onLoginSuccess);
    }
  }
}