import 'package:flutter/material.dart';
import 'package:student_app/main.dart';

class LeaderboardPage extends StatefulWidget {
  const LeaderboardPage({super.key});

  @override
  State<LeaderboardPage> createState() => _LeaderboardPageState();
}

class _LeaderboardPageState extends State<LeaderboardPage> {
  List<Map<String, dynamic>> _users = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchLeaderboard();
  }

  Future<void> _fetchLeaderboard() async {
    try {
      final data = await supabase
          .from('profiles')
          .select('full_name, total_xp') // Fetch only what we need
          .order('total_xp', ascending: false) // Highest XP first
          .limit(50); // Top 50 only

      if (mounted) {
        setState(() {
          _users = List<Map<String, dynamic>>.from(data);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("Error: $e")));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Leaderboard 🏆")),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _users.length,
              itemBuilder: (context, index) {
                final user = _users[index];
                final isMe =
                    supabase.auth.currentUser?.userMetadata?['full_name'] ==
                    user['full_name'];

                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: index == 0
                        ? Colors.amber
                        : Colors.blue.shade100, // Gold for #1
                    foregroundColor: Colors.black,
                    child: Text("#${index + 1}"),
                  ),
                  title: Text(
                    user['full_name'] ?? "Unknown",
                    style: TextStyle(
                      fontWeight: isMe ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  trailing: Text(
                    "${user['total_xp']} XP",
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  tileColor: isMe
                      ? Colors.blue.shade50
                      : null, // Highlight yourself
                );
              },
            ),
    );
  }
}
