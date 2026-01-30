import 'package:flutter/material.dart';

// Bengali localized names for subjects
const Map<String, String> bengaliSubjectNames = {
  'Physics': 'পদার্থবিজ্ঞান',
  'Chemistry': 'রসায়ন',
  'Math': 'গণিত',
  'Biology': 'জীববিজ্ঞান',
  'GK': 'সাধারণ জ্ঞান',
  'ICT': 'তথ্য ও যোগাযোগ প্রযুক্তি',
  'English': 'ইংরেজি',
  'Bangla': 'বাংলা',
  'Higher Math': 'উচ্চতর গণিত',
  'Gen. Knowledge': 'সাধারণ জ্ঞান',
  'Basic Math': 'মৌলিক গণিত',
};

// Subject configuration per stream
List<Map<String, dynamic>> getSubjectsForStream(String stream) {
  const physicsColor = Colors.purple;
  const chemColor = Colors.orange;
  const mathColor = Colors.blue;
  const bioColor = Colors.green;
  const gkColor = Colors.teal;

  if (stream == 'Medical') {
    return [
      {'name': 'Biology', 'icon': Icons.biotech, 'color': bioColor},
      {'name': 'Chemistry', 'icon': Icons.science, 'color': chemColor},
      {'name': 'Physics', 'icon': Icons.bolt, 'color': physicsColor},
      {'name': 'GK', 'icon': Icons.language, 'color': gkColor},
    ];
  } else if (stream == 'Engineering') {
    return [
      {'name': 'Higher Math', 'icon': Icons.functions, 'color': mathColor},
      {'name': 'Physics', 'icon': Icons.bolt, 'color': physicsColor},
      {'name': 'Chemistry', 'icon': Icons.science, 'color': chemColor},
      {'name': 'English', 'icon': Icons.book, 'color': Colors.redAccent},
    ];
  } else if (stream == 'Varsity') {
    return [
      {'name': 'Bangla', 'icon': Icons.text_fields, 'color': Colors.pink},
      {'name': 'English', 'icon': Icons.menu_book, 'color': Colors.indigo},
      {'name': 'Gen. Knowledge', 'icon': Icons.public, 'color': Colors.teal},
      {'name': 'Basic Math', 'icon': Icons.calculate, 'color': Colors.brown},
    ];
  }
  // Default HSC
  return [
    {'name': 'Physics', 'icon': Icons.bolt, 'color': physicsColor},
    {'name': 'Chemistry', 'icon': Icons.science, 'color': chemColor},
    {'name': 'Math', 'icon': Icons.functions, 'color': mathColor},
    {'name': 'Biology', 'icon': Icons.biotech, 'color': bioColor},
    {'name': 'ICT', 'icon': Icons.computer, 'color': Colors.blueGrey},
    {'name': 'Bangla', 'icon': Icons.text_fields, 'color': Colors.pink},
  ];
}
