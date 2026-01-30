import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/university_model.dart';

class UniversityService {
  Future<List<University>> fetchUniversities() async {
    // Fetch Unis AND join with Units table
    final response = await Supabase.instance.client
        .from('universities')
        .select('*, university_units(*)'); // The '*' fetches linked data

    final data = response as List<dynamic>;
    return data.map((json) => University.fromJson(json)).toList();
  }
}
