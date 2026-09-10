import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'auth_wrapper.dart'; // Assure-toi que le chemin est correct
import 'config.dart';

class EngineerDashboard extends StatefulWidget {
  const EngineerDashboard({super.key});

  @override
  State<EngineerDashboard> createState() => _EngineerDashboardState();
}

class _EngineerDashboardState extends State<EngineerDashboard> {
  final supabase = Supabase.instance.client;
  List<Map<String, dynamic>> tasks = [];
  bool isLoading = true;
  String error = '';

  @override
  void initState() {
    super.initState();
    _fetchTasks();
    _listenToChanges();
  }

  Future<void> _fetchTasks() async {
    setState(() {
      isLoading = true;
      error = '';
    });
    try {
      final response = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', ascending: false);
      setState(() {
        tasks = List<Map<String, dynamic>>.from(response);
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        error = 'Erreur de chargement: $e';
        isLoading = false;
      });
    }
  }

  void _listenToChanges() {
    supabase
        .channel('public:tasks')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'tasks',
          callback: (payload) {
            _fetchTasks(); // Recharge en temps réel
          },
        )
        .subscribe();
  }

  Future<void> _verifyTask(int id) async {
    try {
      await supabase
          .from('tasks')
          .update({'is_verified': true})
          .eq('id', id);
      // Le temps réel fera la mise à jour
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _deleteTask(int id) async {
    try {
      await supabase.from('tasks').delete().eq('id', id);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _logout() async {
    await supabase.auth.signOut();
    // ✅ Correction ligne 63 : retrait du const
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => AuthWrapper()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('📋 Tâches Ingénieur'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
            tooltip: 'Déconnexion',
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : error.isNotEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 60, color: Colors.red.shade300),
                      const SizedBox(height: 16),
                      Text(error, textAlign: TextAlign.center),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: _fetchTasks,
                        child: const Text('Réessayer'),
                      ),
                    ],
                  ),
                )
              : tasks.isEmpty
                  ? const Center(child: Text('Aucune tâche pour le moment'))
                  : RefreshIndicator(
                      onRefresh: _fetchTasks,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: tasks.length,
                        itemBuilder: (context, index) {
                          final task = tasks[index];
                          final bool isVerified = task['is_verified'] ?? false;
                          final String priority = task['priority'] ?? 'moyenne';
                          final Color priorityColor = priority == 'haute'
                              ? Colors.red
                              : priority == 'basse'
                              ? Colors.green
                              : Colors.orange;

                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: isVerified ? Colors.green.shade100 : Colors.orange.shade100,
                                child: Icon(
                                  isVerified ? Icons.check_circle : Icons.pending,
                                  color: isVerified ? Colors.green : Colors.orange,
                                ),
                              ),
                              title: Text(
                                task['title'] ?? 'Sans titre',
                                style: TextStyle(
                                  decoration: isVerified ? TextDecoration.lineThrough : null,
                                  color: isVerified ? Colors.grey : Colors.black,
                                ),
                              ),
                              subtitle: Row(
                                children: [
                                  Container(
                                    width: 10,
                                    height: 10,
                                    decoration: BoxDecoration(
                                      color: priorityColor,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(priority.toUpperCase()),
                                  const SizedBox(width: 12),
                                  Text(
                                    _formatDate(task['created_at']),
                                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                                  ),
                                ],
                              ),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (!isVerified)
                                    IconButton(
                                      icon: const Icon(Icons.check_circle_outline, color: Colors.green),
                                      onPressed: () => _verifyTask(task['id']),
                                      tooltip: 'Vérifier',
                                    ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                                    onPressed: () => _deleteTask(task['id']),
                                    tooltip: 'Supprimer',
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month} ${date.hour}h${date.minute}';
    } catch (_) {
      return '';
    }
  }
}