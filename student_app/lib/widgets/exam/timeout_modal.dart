import 'package:flutter/material.dart';

class TimeoutModal extends StatelessWidget {
  final VoidCallback onReattempt;
  final VoidCallback onCancel;

  const TimeoutModal({
    super.key,
    required this.onReattempt,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Row(
        children: [
          Icon(Icons.timer_off, color: Colors.red),
          SizedBox(width: 10),
          Text("Time's Up!"),
        ],
      ),
      content: const Text(
        "আপনার পরীক্ষার সময় শেষ হয়েছে। আপনার বর্তমান উত্তরপত্রটি স্বয়ংক্রিয়ভাবে জমা দেওয়া হয়েছে।",
      ),
      actions: [
        TextButton(onPressed: onCancel, child: const Text("Close")),
        ElevatedButton(
          onPressed: onReattempt,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.indigo,
            foregroundColor: Colors.white,
          ),
          child: const Text("Try Again"),
        ),
      ],
    );
  }
}
