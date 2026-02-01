<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::table('charges', function (Blueprint $table) {
      if (!Schema::hasColumn('charges', 'paid_on')) {
        $table->date('paid_on')->nullable()->after('paid_cents');
      }
      if (!Schema::hasColumn('charges', 'method')) {
        $table->enum('method', ['cash','card','yape','plin','transfer'])->nullable()->after('paid_on');
      }
    });
  }

  public function down(): void
  {
    Schema::table('charges', function (Blueprint $table) {
      if (Schema::hasColumn('charges', 'method')) $table->dropColumn('method');
      if (Schema::hasColumn('charges', 'paid_on')) $table->dropColumn('paid_on');
    });
  }
};
